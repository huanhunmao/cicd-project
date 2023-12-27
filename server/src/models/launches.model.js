const axios = require('axios');
const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100

const launch = {
    flightNumber: 100, // flight_number
    mission: 'Kepler Exploration X', // name
    rocket: 'Explorer IS1', // rocket.name
    launchDate: new Date('December 27, 2030'), // date_local
    target: 'Kepler-442 b', // not applicable
    customers:['ZTM','NASA'],  // payloads.customers for each payload
    upcoming:true, // upcoming
    success: true // success
}

saveLaunch(launch)

async function findLaunch(filter){
    return await launchesDatabase.findOne(filter)
}

async function existsLaunchWithId(launchId) {
    return await launchesDatabase.findOne({
        flightNumber: launchId
    })
}

async function getLatestFlightNumber(){
    // findOne()用于查找匹配查询条件的第一条记录
    // sort('-flightNumber')用于按照flightNumber字段降序排列结果
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber')

    if(!latestLaunch) return DEFAULT_FLIGHT_NUMBER

    return latestLaunch.flightNumber
}

async function getAllLaunches(skip, limit) { 
    return await launchesDatabase
    .find(
        {},{
            "_id":0,
            "__v":0
    })
    .skip(skip)
    .limit(limit)
}

async function saveLaunch(launch) {
    await launchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true,
    })
}

async function scheduleNewLaunch(launch) {
    const planet =  await planets.findOne({
        keplerName: launch.target
    })

    if(!planet){
        throw new Error('Not matching planet found')
    }


    const newFlightNumber = await getLatestFlightNumber() + 1

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers:['ZTM','NASA'],
        flightNumber: newFlightNumber
    })

    await saveLaunch(newLaunch)
}

async function abortLaunchById(launchId) {
    const aborted =  await launchesDatabase.updateOne({
        flightNumber: launchId
    },{
        upcoming: false,
        success: false,
    })

    return aborted.modifiedCount === 1
    // const aborted = launches.get(launchId)
    // aborted.success = false
    // aborted.upcoming = false
    // return aborted
}

async function populateLaunches(){
    const response = await axios.post(SPACEX_API_URL,{
        query: {},
        options:{
            // 不分页 拿到所有数据
            pagination:false,
            populate:[
                {
                    path: 'rocket',
                    select:{
                        name:1
                    }
                },
                {
                    path: 'payloads',
                    select:{
                        customers:1
                    }
                }
            ]
        }
    })

    const launchDocs = response.data.docs 
    for(const launchDoc of launchDocs){
        const payloads = launchDoc.payloads 
        // 使用 flatMap 将嵌套数组扁平化
        const customers = payloads.flatMap(payload => payload.customers)

        const launch = {
            flightNumber: launchDoc.flight_number,
            mission:launchDoc.name,
            rocket: launchDoc.rocket.name,
            launchDate: launchDoc.date_local,
            customers,
            upcoming: launchDoc.upcoming,
            success: launchDoc.success
        }

        // console.log('launch',`${launch.flightNumber} ${launch.mission}`);
        await saveLaunch(launch);
    }

    if(response.status !== 200) {
        console.log('Problem downloading launch data');
    }
}

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'

async function loadLaunchData(){
    const firstLaunch = await findLaunch({
        flightNumber:1,
        rocket:'Falcon 1',
        mission:'FalconSat'
    })

    if(firstLaunch){
        console.log('Launch data already loaded');
    }else{
        await populateLaunches()
    }


}

module.exports = {
    getAllLaunches,
    scheduleNewLaunch,
    existsLaunchWithId,
    abortLaunchById,
    loadLaunchData,
}