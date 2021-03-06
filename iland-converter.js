/* --------------------------------------//

      Plugin   [ILand] Data converter.
    
// --------------------------------------*/

let DATA_PATH = "plugins/iland-converter/"
if (File.exists("EnableILandDevMode")) {
    DATA_PATH = 'Project/iLand-Mods/iland-converter/'
}

// Import apis from iLand.

ImportedApis = {
    Inited: false,
    GetVersion: ll.import("ILAPI_GetApiVersion"),
    CreateLand: ll.import("ILAPI_CreateLand"),
    UpdatePermission: ll.import("ILAPI_UpdatePermission"),
    UpdateSetting: ll.import("ILAPI_UpdateSetting")
}

// Init logger

logger.setTitle('Converter')
logger.setConsole(true)

// Init utils.

function DimGetRange(dimid) {
    switch (dimid) {
        case 0:
            return [-64,320]
        case 1:
            return [0,128]
        case 2:
            return [0,256]
        default:
            return [0,0]
    }
}

// Startup.

mc.listen('onServerStarted',function () {
    if (!ImportedApis.GetVersion) {
        logger.error('iLand is not installed or too old!')
        return
    }
    let ver = ImportedApis.GetVersion()
    if (ver!=201) {
        logger.error('Unadapted ILAPI version(' + ver + ').')
        return
    }
    ImportedApis.Inited = true;
})

mc.regConsoleCmd('iconv','land converter',function(args) {

    // Check ILAPI.
    if (!ImportedApis.Inited) {
        logger.error('ILAPI is not inited.')
        return
    }

    let res,count_all,count_now
    switch (args[0]) {
        case 'pland':
            res = JSON.parse(file.readFrom(DATA_PATH + 'pland.json'))
            count_all = Object.keys(res.landdata).length
            count_now = 0
            Object.keys(res.landdata).forEach(function(key){
                count_now += 1
                let land = res.landdata[key]
                let owner = land.playerxuid
                let spos = {x:land.x1,y:land.y1,z:land.z1}
                let epos = {x:land.x2,y:land.y2,z:land.z2}
                let dimid = land.worldid
                if (land.Dim == '2D') {
                    let rg = DimGetRange(dimid)
                    spos.y = rg[0]
                    epos.y = rg[1]
                }
                let landId = ImportedApis.CreateLand(owner,spos,epos,dimid)
                if (!landId) {
                    logger.error("RPC packet loss when convert land ['" + key + "'], skipping...")
                    return;
                }
                if (landId == -1) {
                    logger.error("The API found a problem when checking land ['" + key + "'], skipping...")
                    return
                }
                ImportedApis.UpdatePermission(landId,'allow_destroy',land.destroyblock)
                ImportedApis.UpdatePermission(landId,'allow_open_chest',land.openchest)
                ImportedApis.UpdatePermission(landId,'allow_place',land.putblock)
                ImportedApis.UpdateSetting(landId,'share',land.shareplayer)
                if (land.sign.displayname) {
                    ImportedApis.UpdateSetting(landId,'nickname',land.sign.displayname)
                }
                if (land.sign.message) {
                    ImportedApis.UpdateSetting(landId,'describe',land.sign.message)
                }
                if (land.sign.push_block) {
                    ImportedApis.UpdateSetting(landId,'ev_piston_push',land.sign.push_block)
                }
                logger.info('PLand >> (' + count_now + '/' + count_all + ') landId: ' + landId + " owner: " + owner)
            })
            logger.info('PLand >> Complete, converted ' + count_all + " lands.")
            break;
        case 'pfland':
            res = JSON.parse(file.readFrom(DATA_PATH+"pfland.json"))
            count_all = res.Lands.length
            count_now = 0
            Object.keys(res.Lands).forEach(function(key) {
                count_now += 1
                let land = res.Lands[key]
                let spos = {x:land.X1,y:land.Y1,z:land.Z1}
                let epos = {x:land.X2,y:land.Y2,z:land.Z2}
                let dimid = land.Dimension
                let owner = land.PlayerXuid
                if (land.LandType == '2D') {
                    let rg = DimGetRange(dimid)
                    spos.y = rg[0]
                    epos.y = rg[1]
                }
                let landId = ImportedApis.CreateLand(owner,spos,epos,dimid)
                if (!landId) {
                    logger.error("RPC packet loss when convert land ['" + key + "'], skipping...")
                    return;
                }
                if (landId == -1) {
                    logger.error("The API found a problem when checking land ['" + key + "'], skipping...")
                    return
                }
                let friends = new Array()
                land.PlayersShared.forEach(function(pl,index){
                    friends.push(pl.PlayerXuid)
                })
                ImportedApis.UpdateSetting(landId,'share',friends)
                if (land.Public.UseBucket) {
                    ImportedApis.UpdatePermission(landId,'use_bucket',land.Public.UseBucket)
                }
                if (land.Public.AttackPlayer) {
                    ImportedApis.UpdatePermission(landId,'allow_attack_player',land.Public.AttackPlayer)
                }
                if (land.Public.AttackMob) {
                    ImportedApis.UpdatePermission(landId,'allow_attack_mobs',land.Public.AttackMob)
                }
                if (land.Public.DestroyBlock) {
                    ImportedApis.UpdatePermission(landId,'allow_destroy',land.Public.DestroyBlock)
                }
                if (land.Public.DropItem) {
                    ImportedApis.UpdatePermission(landId,'allow_dropitem',land.Public.DropItem)
                }
                if (land.Public.PickUpItem) {
                    ImportedApis.UpdatePermission(landId,'allow_pickupitem',land.Public.PickUpItem)
                }
                if (land.Public.PlaceBlock) {
                    ImportedApis.UpdatePermission(landId,'allow_place',land.Public.PlaceBlock)
                }
                if (land.Public.OpenChest) {
                    ImportedApis.UpdatePermission(landId,'allow_open_chest',land.Public.OpenChest)
                }
                if (land.Public.FarmLandDecay) {
                    ImportedApis.UpdateSetting(landId,'ev_farmland_decay',land.Public.FarmLandDecay)
                }
                if (land.Public.UseItemFrame) {
                    ImportedApis.UpdateSetting(landId,'use_item_frame',land.Public.UseItemFrame)
                }
                if (land.Public.LevelExplode) {
                    ImportedApis.UpdateSetting(landId,'ev_explode',land.Public.LevelExplode)
                }
                if (land['Sign.Displayname']) {
                    ImportedApis.UpdateSetting(landId,'nickname',land['Sign.Displayname'])
                }
                if (land['Sign.Message']) {
                    ImportedApis.UpdateSetting(landId,'describe',land['Sign.Message'])
                }
                if (land.TeleportPos) {
                    let mp = new Array(
                        land.TeleportPos.x,
                        land.TeleportPos.y,
                        land.TeleportPos.z
                    )
                    ImportedApis.UpdateSetting(landId,'tpoint',mp)
                }
                logger.info('PFLand >> (' + count_now + '/' + count_all + ') landId: ' + landId + " owner: " + owner)
            })
            logger.info('PFLand >> Complete, converted ' + count_all + " lands.")
            break;
        case 'landg7':
        case 'land-g7':
            logger.error('If you\'re using land-g7, please convert data to "pland" by pland at first.')
            break;
        case 'myland':
            res = JSON.parse(file.readFrom(DATA_PATH+"myland.json"))
            count_all = Object.keys(res).length
            count_now = 0
            Object.keys(res).forEach(function(land) {
                count_now += 1
                let box = land.split('::')
                let posA = box[0].split(':')
                let posB = box[1].split(':')
                posA = { x:parseInt(posA[0]), y:parseInt(posA[1]), z:parseInt(posA[2]), dimid:parseInt(posA[3]) }
                posB = { x:parseInt(posB[0]), y:parseInt(posB[1]), z:parseInt(posB[2]), dimid:parseInt(posB[3]) }
                
                // 2D only?
                let rg = DimGetRange(posA.dimid)
                posA.y = rg[0]
                posB.y = rg[1]
                
                let owner = res[land].masterXuid
                let landId = ImportedApis.CreateLand(owner,posA,posB,posA.dimid)
                if (!landId) {
                    logger.error("RPC packet loss when convert land ['" + land + "'], skipping...")
                    return
                }
                if (landId == -1) {
                    logger.error("The API found a problem when checking land ['" + land + "'], skipping...")
                    return
                }
                let friends = new Array()
                for (let name in res[land].friends) {
                    friends.push(res[land].friends[name])
                }
                ImportedApis.UpdateSetting(landId,'share',friends)
                ImportedApis.UpdateSetting(landId,'nickname',res[land].title)
                logger.info('MyLand >> (' + count_now + '/' + count_all + ') landId: ' + landId + " owner: " + owner)
            })
            logger.info('MyLand >> Complete, converted ' + count_all + " lands.")
            break;
        default:
            logger.error('Unknown land data type "' + args[0] + '", please check or contact with author.')
            break;
    }

})

logger.info('>> pland loaded.')
logger.info('>> pfland loaded.')
logger.info('>> myland loaded.')