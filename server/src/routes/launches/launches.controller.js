const {getAllLaunches, scheduleNewLaunch, existsLaunchWithId,abortLaunchById} = require('../../models/launches.model')
const {getPagination} = require('../../services/query')

async function httpGetAllLaunch(req, res){
    console.log(req.query);
    const {skip, limit} = getPagination(req.query)
    const launches = await getAllLaunches(skip,limit)
    // Array.from 将数据拆分放到一个数组内
    return res.status(200).json(launches)
}

async function httpAddLaunch(req, res){
    const launch = req.body 

    if(!launch.mission || !launch.rocket || !launch.target || !launch.launchDate){
        return res.status(400).json({
            error:'Missing required launch property'
        })
    }

    launch.launchDate = new Date(launch.launchDate)

    if(isNaN(launch.launchDate)){
        return res.status(400).json({
            error:'Invalid launch date'
        })
    }

    await scheduleNewLaunch(launch)

    return res.status(201).json(launch)
}

async function httpAbortLaunch(req, res){
    const launchId = Number(req.params.id)

    const  existsLaunch = await existsLaunchWithId(launchId)

    if(!existsLaunch){
    // if launch does not exist
    return res.status(404).json({
        error:'Launch does not exist'
    })
    }

    // if launch does  exist
    const aborted = await abortLaunchById(launchId)
    return res.status(200).json({
        ok: true
    })

}

module.exports = {
    httpGetAllLaunch,
    httpAddLaunch,
    httpAbortLaunch
}