// LiteLoader-AIDS automatic generated
/// <reference path="d:\2\LiteLDev/dts/helperlib/src/index.d.ts"/> 

/**
 * 信息
 * 插件名称: LeviResidence
 * 插件版本: 1.0.0
 * 插件作者: 1503Dev
 * MineBBS: https://www.minebbs.com/members/dev.154006/
 * 
 * 配置文件
 * 插件配置: /plugins/LeviResidence/config.json
 * 领地数据: /plugins/LeviResidence/residence/ 或 /worlds/你的存档/residence/
 * 
 * 插件基本设置配置项
 * save_to_level: 领地数据是否保存到存档
 * command: 插件命令
 * allow_use_admin_commands: 是否允许使用管理员命令
 * 其他配置项请在游戏内使用 /resadmin 修改
 * 
 * 默认命令
 * /res
 * /resadmin
 * /respa
 * 
 * 说明
 * 新人作品，没有经过严格的测试
 * 插件名字纯属蹭热度，本插件与 Java 版的 Residence 插件无关
 * 测试使用版本: LeviLamina v0.12.4, Minecraft v1.20.81 (开发中测试)
 *              LeviLamina v1.2.1, Minecraft v1.21.70 (粗略测试)
 */

const Plugin = {
    name: 'LeviResidence',
    desc: '强大的，可高度自定义的LSE领地插件',
    ver: '1.0.0'
}
ll.registerPlugin(
    Plugin.name,
    Plugin.desc,
    Plugin.ver.split('.'),
    {
        author: '1503Dev'
    }
)
logger.setTitle(Plugin.name)

const DIR_ROOT = 'plugins/' + Plugin.name + '/'
const PATH_CONFIG = DIR_ROOT + 'config.json'
const PATH_SERVER_PROPERTIES = 'server.properties'
var DIR_LEVEL_ROOT = DIR_ROOT
var PATH_DATA = DIR_LEVEL_ROOT + 'residence'

// #region 前置代码

class PropertiesParser { constructor(t) { this.properties = {}, this.parse(t) } parse(t) { if (!t) return; const e = t.split(/\r?\n/); for (const t of e) { if (!t.trim() || t.trim().startsWith("#")) continue; const e = this.findDelimiterIndex(t); if (-1 === e) continue; const r = this.unescape(t.substring(0, e).trim()), s = this.unescape(t.substring(e + 1).trim()); this.properties[r] = s } } findDelimiterIndex(t) { let e = !1; for (let r = 0; r < t.length; r++) { const s = t[r]; if (e) e = !1; else if ("\\" !== s) { if ("=" === s || ":" === s) return r } else e = !0 } return -1 } unescape(t) { return t.replace(/\\([\\:=#!\s])/g, "$1") } get(t) { return this.properties[t] } getAll() { return { ...this.properties } } }
class Residence {
    constructor(obj) {
        this.public_perm = {}
        this.private_perm = {}
        this.settings = {}
        for (const key in obj) {
            this[key] = obj[key]
        }
    }

    setProperty(key, value) { this[key] = value }
    setPublicPerm(key, value) {
        this.public_perm[key] = value
        putResidence(this)
    }
    setPublicPermNoAutoSave(key, value) {
        this.public_perm[key] = value
    }
    setPrivatePerm(plName, perm, value) {
        if (!this.private_perm[plName]) {
            this.private_perm[plName] = {}
        }
        this.private_perm[plName][perm] = value
        putResidence(this)
    }
    setPrivatePermNoAutoSave(plName, perm, value) {
        if (!this.private_perm[plName]) {
            this.private_perm[plName] = {}
        }
        this.private_perm[plName][perm] = value
    }
    setName(name) { this.name = name }
    getWidth() {
        return Math.abs(this.pos1[0] - this.pos2[0]) + 1
    }
    getHeight() {
        return Math.abs(this.pos1[1] - this.pos2[1]) + 1
    }
    getLength() {
        return Math.abs(this.pos1[2] - this.pos2[2]) + 1
    }
    getArea() {
        return this.getWidth() * this.getLength()
    }
    getVolume() {
        return this.getArea() * this.getHeight()
    }
    getCost() {
        if (this.cost !== null && this.cost !== undefined) {
            return this.cost
        }
        return this.getVolume() * conf.get('cost_per_block')
    }
    getPerms() {
        return new ResidencePerms(this)
    }
    /**
     * 检查是否包含指定位置
     * @param {IntPos} pos 要检查的位置
     * @returns {Boolean} 是否包含
     */
    isContain(pos) {
        if (pos.dimid !== this.pos1[3] || pos.dimid !== this.pos2[3]) {
            return false;
        }

        const minX = Math.min(this.pos1[0], this.pos2[0]);
        const minY = Math.min(this.pos1[1], this.pos2[1]);
        const minZ = Math.min(this.pos1[2], this.pos2[2]);
        const maxX = Math.max(this.pos1[0], this.pos2[0]);
        const maxY = Math.max(this.pos1[1], this.pos2[1]);
        const maxZ = Math.max(this.pos1[2], this.pos2[2]);

        return (
            pos.x >= minX &&
            pos.x <= maxX &&
            pos.y >= minY &&
            pos.y <= maxY &&
            pos.z >= minZ &&
            pos.z <= maxZ
        );
    }
    getSettings() {
        return this.settings || {}
    }
    setSetting(key, value) {
        if (!this.settings) {
            this.settings = {}
        }
        this.settings[key] = value
        putResidence(this)
    }
    setSettingNoAutoSave(key, value) {
        if (!this.settings) {
            this.settings = {}
        }
        this.settings[key] = value
    }
    isOverlapWith(otherRes) {
        if (this.pos1[3] !== otherRes.pos1[3] || this.pos2[3] !== otherRes.pos2[3]) {
            return false;
        }

        const thisMinX = Math.min(this.pos1[0], this.pos2[0]);
        const thisMinY = Math.min(this.pos1[1], this.pos2[1]);
        const thisMinZ = Math.min(this.pos1[2], this.pos2[2]);
        const thisMaxX = Math.max(this.pos1[0], this.pos2[0]);
        const thisMaxY = Math.max(this.pos1[1], this.pos2[1]);
        const thisMaxZ = Math.max(this.pos1[2], this.pos2[2]);

        const otherMinX = Math.min(otherRes.pos1[0], otherRes.pos2[0]);
        const otherMinY = Math.min(otherRes.pos1[1], otherRes.pos2[1]);
        const otherMinZ = Math.min(otherRes.pos1[2], otherRes.pos2[2]);
        const otherMaxX = Math.max(otherRes.pos1[0], otherRes.pos2[0]);
        const otherMaxY = Math.max(otherRes.pos1[1], otherRes.pos2[1]);
        const otherMaxZ = Math.max(otherRes.pos1[2], otherRes.pos2[2]);

        return !(
            thisMaxX < otherMinX ||
            thisMinX > otherMaxX ||
            thisMaxY < otherMinY ||
            thisMinY > otherMaxY ||
            thisMaxZ < otherMinZ ||
            thisMinZ > otherMaxZ
        );
    }
    isAABBOverlap(aabb) {
        if (this.pos1[3] !== aabb.dimid || this.pos2[3] !== aabb.dimid) {
            return false;
        }

        const thisMinX = Math.min(this.pos1[0], this.pos2[0]);
        const thisMinY = Math.min(this.pos1[1], this.pos2[1]);
        const thisMinZ = Math.min(this.pos1[2], this.pos2[2]);
        const thisMaxX = Math.max(this.pos1[0], this.pos2[0]);
        const thisMaxY = Math.max(this.pos1[1], this.pos2[1]);
        const thisMaxZ = Math.max(this.pos1[2], this.pos2[2]);

        const aabbMinX = aabb.min.x;
        const aabbMinY = aabb.min.y;
        const aabbMinZ = aabb.min.z;
        const aabbMaxX = aabb.max.x;
        const aabbMaxY = aabb.max.y;
        const aabbMaxZ = aabb.max.z;

        return !(
            thisMaxX < aabbMinX ||
            thisMinX > aabbMaxX ||
            thisMaxY < aabbMinY ||
            thisMinY > aabbMaxY ||
            thisMaxZ < aabbMinZ ||
            thisMinZ > aabbMaxZ
        );
    }

    getTeleportPos() {
        if (this.teleport_pos) {
            return new IntPos(this.teleport_pos[0], this.teleport_pos[1], this.teleport_pos[2], this.teleport_pos[3])
        }
        return new IntPos(this.pos2[0], this.pos2[1], this.pos2[2], this.pos2[3])
    }

    setTeleportPos(pos) {
        this.teleport_pos = [pos.x, pos.y, pos.z, pos.dimid]
        putResidence(this)
    }

    getAdmins() {
        return this.admins || []
    }

    getMembers() {
        return this.members || []
    }

    addAdmin(plName) {
        if (!this.admins) this.admins = []
        if (!this.admins.includes(plName)) {
            this.admins.push(plName)
            putResidence(this)
        }
    }

    addMember(plName) {
        if (!this.members) this.members = []
        if (!this.members.includes(plName)) {
            this.members.push(plName)
            putResidence(this)
        }
    }

    removeAdmin(plName) {
        if (!this.admins) this.admins = []
        if (this.admins.includes(plName)) {
            this.admins.shift(plName)
            putResidence(this)
        }
    }

    removeMember(plName) {
        if (!this.members) this.members = []
        if (this.members.includes(plName)) {
            this.members.shift(plName)
            putResidence(this)
        }
    }

    showBorder() {
        const pos1 = new IntPos(this.pos1[0], this.pos1[1], this.pos1[2], this.pos1[3])
        const pos2 = new IntPos(this.pos2[0], this.pos2[1], this.pos2[2], this.pos2[3])
        new CubicParticlePointSet(pos1, pos2).forEach(p => {
            mc.spawnParticle(p, 'minecraft:endrod')
        })
        new CubicParticlePointSet(pos1, pos2).forEach(p => {
            mc.spawnParticle(p, 'minecraft:endrod')
        })
    }

    /**
     * 复制领地
     * @returns {Residence} 复制后的领地
     */
    copyObject() {
        return new Residence({ ...this })
    }

    /**
     * 扩展领地
     * @param {number} direction 扩展方向
     * @param {number} blocks 扩展的格数
     * @returns {boolean} 是否扩展成功
     */
    expand(direction, blocks) {
        if (blocks <= 0) return false;

        const originalPos1 = [...this.pos1];
        const originalPos2 = [...this.pos2];

        try {
            switch (direction) {
                case 2:
                    if (this.pos1[2] < this.pos2[2]) {
                        this.pos1[2] -= blocks;
                    } else {
                        this.pos2[2] -= blocks;
                    }
                    break;
                case 3:
                    if (this.pos1[0] < this.pos2[0]) {
                        this.pos2[0] += blocks;
                    } else {
                        this.pos1[0] += blocks;
                    }
                    break;
                case 0:
                    if (this.pos1[2] < this.pos2[2]) {
                        this.pos2[2] += blocks;
                    } else {
                        this.pos1[2] += blocks;
                    }
                    break;
                case 1:
                    if (this.pos1[0] < this.pos2[0]) {
                        this.pos1[0] -= blocks;
                    } else {
                        this.pos2[0] -= blocks;
                    }
                    break;
                case 4:
                    if (this.pos1[1] < this.pos2[1]) {
                        this.pos2[1] += blocks;
                    } else {
                        this.pos1[1] += blocks;
                    }
                    break;
                case 5:
                    if (this.pos1[1] < this.pos2[1]) {
                        this.pos1[1] -= blocks;
                    } else {
                        this.pos2[1] -= blocks;
                    }
                    break;
                default:
                    return false;
            }

            if (conf.get('max_width') > 0 && (this.getLength() > conf.get('max_length') || this.getWidth() > conf.get('max_width'))) {
                throw new Error("领地长度超出限制");
            }
            if (conf.get('max_height') > 0 && this.getHeight() > conf.get('max_height')) {
                throw new Error("领地高度超出限制");
            }
            if (conf.get('max_volume') > 0 && this.getVolume() > conf.get('max_volume')) {
                throw new Error("领地体积超出限制");
            }
            if (conf.get('max_area') > 0 && this.getArea() > conf.get('max_area')) {
                throw new Error("领地面积超出限制");
            }

            const allResidences = getResidences();
            for (const res of allResidences) {
                if (res.id !== this.id && this.isOverlapWith(res)) {
                    throw new Error("扩展后的领地与其他领地重叠");
                }
            }
            const protectedAreas = getProtectedAreas();
            for (const area of protectedAreas) {
                if (area.isIn(this)) {
                    throw new Error("扩展后的领地与受保护区域重叠");
                }
            }

            this.cost = this.getVolume() * conf.get('cost_per_block');

            return true;
        } catch (e) {
            this.pos1 = originalPos1;
            this.pos2 = originalPos2;
            return false;
        }
    }
}
class CubicParticlePointSet {
    /**
     * 构造函数
     * @param {IntPos} pos1 第一个点
     * @param {IntPos} pos2 第二个点
     */
    constructor(pos1, pos2) {
        this.pos1 = pos1;
        this.pos2 = pos2;
        this.points = [];
        this.generateFramePoints();
        this.trimPoints();
    }
    generateFramePoints() {
        const minX = Math.min(this.pos1.x, this.pos2.x);
        const minY = Math.min(this.pos1.y, this.pos2.y);
        const minZ = Math.min(this.pos1.z, this.pos2.z);
        const maxX = Math.max(this.pos1.x, this.pos2.x);
        const maxY = Math.max(this.pos1.y, this.pos2.y);
        const maxZ = Math.max(this.pos1.z, this.pos2.z);
        const dimid = this.pos1.dimid;
        const points = this.points;
        const add = (x, y, z) => points.push(new FloatPos(x + 0.5, y + 0.5, z + 0.5, dimid));

        const xLen = maxX - minX;
        const yLen = maxY - minY;
        const zLen = maxZ - minZ;

        if (xLen > 1) {
            for (let x = minX + 1; x < maxX; x++) {
                add(x, minY, minZ);
                add(x, minY, maxZ);
                add(x, maxY, minZ);
                add(x, maxY, maxZ);
            }
        }

        if (yLen > 1) {
            for (let y = minY + 1; y < maxY; y++) {
                add(minX, y, minZ);
                add(maxX, y, minZ);
                add(minX, y, maxZ);
                add(maxX, y, maxZ);
            }
        }

        if (zLen > 1) {
            for (let z = minZ + 1; z < maxZ; z++) {
                add(minX, minY, z);
                add(minX, maxY, z);
                add(maxX, minY, z);
                add(maxX, maxY, z);
            }
        }

        this.cornerPoints = [
            { x: minX, y: minY, z: minZ },
            { x: minX, y: minY, z: maxZ },
            { x: minX, y: maxY, z: minZ },
            { x: minX, y: maxY, z: maxZ },
            { x: maxX, y: minY, z: minZ },
            { x: maxX, y: minY, z: maxZ },
            { x: maxX, y: maxY, z: minZ },
            { x: maxX, y: maxY, z: maxZ }
        ].map(p => new FloatPos(p.x + 0.5, p.y + 0.5, p.z + 0.5, dimid));

        this.cornerPoints.forEach(p => points.push(p));
    }
    trimPoints() {
        const MAX_POINTS = 64;
        if (this.points.length <= MAX_POINTS) return;

        const cornerSet = new Set(this.cornerPoints.map(p => `${p.x},${p.y},${p.z}`));
        const edgePoints = this.points.filter(p => !cornerSet.has(`${p.x},${p.y},${p.z}`));

        const pointsToRemove = this.points.length - MAX_POINTS;
        if (pointsToRemove <= 0) return;

        for (let i = edgePoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [edgePoints[i], edgePoints[j]] = [edgePoints[j], edgePoints[i]];
        }

        const remainingEdgePoints = edgePoints.slice(0, edgePoints.length - pointsToRemove);

        this.points = [...this.cornerPoints, ...remainingEdgePoints];
    }

    /**
     * 遍历所有点
     * @param {Function} callback 回调函数
     */
    forEach(callback) {
        this.points.forEach(callback);
    }

    /**
     * 获取点的数量
     * @returns {number} 点的数量
     */
    getLength() {
        return this.points.length;
    }
}
class ProtectedArea {
    constructor(obj) {
        for (const key in obj) {
            this[key] = obj[key];
        }
    }

    /**
     * 判断受保护区域是否与领地重叠
     * @param {Residence} res 领地对象
     * @returns {boolean} 是否重叠
     */
    isIn(res) {
        if (this.pos1[3] !== res.pos1[3] || this.pos2[3] !== res.pos2[3]) {
            return false;
        }

        const protectedMinX = Math.min(this.pos1[0], this.pos2[0]);
        const protectedMinY = Math.min(this.pos1[1], this.pos2[1]);
        const protectedMinZ = Math.min(this.pos1[2], this.pos2[2]);
        const protectedMaxX = Math.max(this.pos1[0], this.pos2[0]);
        const protectedMaxY = Math.max(this.pos1[1], this.pos2[1]);
        const protectedMaxZ = Math.max(this.pos1[2], this.pos2[2]);

        const resMinX = Math.min(res.pos1[0], res.pos2[0]);
        const resMinY = Math.min(res.pos1[1], res.pos2[1]);
        const resMinZ = Math.min(res.pos1[2], res.pos2[2]);
        const resMaxX = Math.max(res.pos1[0], res.pos2[0]);
        const resMaxY = Math.max(res.pos1[1], res.pos2[1]);
        const resMaxZ = Math.max(res.pos1[2], res.pos2[2]);

        const notOverlapping = (
            protectedMaxX < resMinX ||
            protectedMinX > resMaxX ||
            protectedMaxY < resMinY ||
            protectedMinY > resMaxY ||
            protectedMaxZ < resMinZ ||
            protectedMinZ > resMaxZ
        );

        return !notOverlapping;
    }

    isInPos(pos) {
        if (pos.dimid !== this.pos1[3] || pos.dimid !== this.pos2[3]) {
            return false;
        }
        const minX = Math.min(this.pos1[0], this.pos2[0]);
        const minY = Math.min(this.pos1[1], this.pos2[1]);
        const minZ = Math.min(this.pos1[2], this.pos2[2]);
        const maxX = Math.max(this.pos1[0], this.pos2[0]);
        const maxY = Math.max(this.pos1[1], this.pos2[1]);
        const maxZ = Math.max(this.pos1[2], this.pos2[2]);

        return (
            pos.x >= minX &&
            pos.x <= maxX &&
            pos.y >= minY &&
            pos.y <= maxY &&
            pos.z >= minZ &&
            pos.z <= maxZ
        );
    }

    getDimName() {
        return DimensionName[this.pos1[3]]
    }

    getAABB() {
        return new AABB(
            new IntPos(this.pos1[0], this.pos1[1], this.pos1[2], this.pos1[3]),
            new IntPos(this.pos2[0], this.pos2[1], this.pos2[2], this.pos2[3]),
            this.pos1[3]
        )
    }
}
class ResidencePerms {
    /**
     * 构造函数
     * @param {Residence} res 领地对象
     */
    constructor(res) {
        this.res = res;
        this.members = res.members || [];
        this.admins = res.admins || [];
        this.owner = res.owner || '';
        this.public_perm = res.public_perm || {};
        this.private_perm = res.private_perm || {};
    }

    /**
     * 验证玩家是否有指定的权限
     * @param {Player} pl 玩家对象
     * @param {string} perm 权限名称
     * @returns {boolean} 是否有权限
     */
    verify(pl, perm) {
        const plName = pl.realName
        if (this.isOwner(pl) || this.isAdmin(pl)) {
            return true
        }
        const pp = this.private_perm[plName] || {}
        if (this.public_perm[perm] && !pp._override) {
            return true
        }
        if (this.isMember(pl) && !pp._override) {
            return true
        }
        if (pp._override) {
            return pp[perm] == true
        }
        return false
    }

    isAdmin(pl) {
        return this.admins.includes(pl.realName)
    }

    isMember(pl) {
        return this.members.includes(pl.realName)
    }

    isOwner(pl) {
        return this.owner === pl.realName
    }
}
class OccupyingPlayer {
    constructor(name, xuid = '', uuid = '') {
        this.realName = name
        this.name = name
        this.xuid = xuid
        this.uuid = uuid
    }
}
class AABB {
    constructor(min, max, dimid) {
        this.min = min;
        this.max = max;
        this.dimid = dimid;
    }

    getRangeString() {
        return `from ${this.min.x}, ${this.min.y}, ${this.min.z} to ${this.max.x}, ${this.max.y}, ${this.max.z}`;
    }
}

const CostType = {
    CONST: 0,
    PERCENT: 1
}
const Dimension = ['overworld', 'nether', 'end']
const DimensionName = ['主世界', '下界', '末地']
const ResidencePermName = {
    chat: '聊天',
    attack_entity: '攻击实体(玩家除外)',
    attack_player: '攻击玩家',
    use_item: '使用物品',
    use_item_on_block: '对方块使用物品',
    destroy_block: '破坏方块',
    place_block: '放置方块',
    open_container: '打开容器(末影箱除外)',
    open_ender_chest: '打开末影箱',
    use_workbench: '使用工作方块',
    interact_block: '交互方块',
    bucket_place: '倒出液体',
    bucket_take: '舀取液体',
    take_item: '拾取物品',
    drop_item: '丢弃物品',
    eat: '进食',
    use_respawn_anchor: '使用重生锚',
    pull_fishing_hook: '鱼竿拉取实体',
    enter_bed: '上床',
    interact_entity: '交互实体',
    player_spawn_projectile: '玩家发射投掷物',
    player_step_on_pressure_plate: '玩家踩压力板',
    player_ride_entity: '玩家骑乘实体',
    change_armor_stand: '操作盔甲架',
    use_frame_block: '操作物品展示框'
}
const workbenches = {
    'minecraft:crafting_table': '工作台',
    'minecraft:cartography_table': '制图台',
    'minecraft:smithing_table': '锻造台',
    'minecraft:anvil': '铁砧',
    'minecraft:chipped_anvil': '开裂的铁砧',
    'minecraft:damaged_anvil': '损坏的铁砧',
    'minecraft:stonecutter_block': '切石机',
    'minecraft:enchanting_table': '附魔台',
    'minecraft:grindstone': '砂轮',
    'minecraft:loom': '织布机',
}
const RescidenceSettingsName = {
    show_tips_on_enter: '进入领地时显示提示',
    always_show_residence_name: '在领地内时显示领地名称',
    allow_residence_be_discovered: '在世界领地上显示你的领地并且所有人可传送',
    allow_members_teleport: '允许成员传送到领地',
    allow_wither_boss_destroy: '允许凋零破坏领地',
    allow_mob_spawn: '允许生物自然生成',
    allow_entity_explode: '允许实体爆炸(无法阻止领地外高强度爆炸)',
    allow_block_explode: '允许方块爆炸(无法阻止重生锚和领地外高强度爆炸)',
    allow_respawn_anchor_explode: '允许重生锚爆炸(无法阻止领地外重生锚爆炸)',
    allow_fire_spread: '允许火焰蔓延(无法阻止方块被烧毁)',
}
const DirectionName = ['南(Z+)', '西(X-)', '北(Z-)', '东(X+)', '上(Y+)', '下(Y-)']

// #endregion

if (!File.exists(DIR_ROOT)) {
    File.mkdir(DIR_ROOT)
}
const conf = new JsonConfigFile(PATH_CONFIG, '{}')
conf.init('save_to_level', true)
conf.init('command', 'res')

if (conf.get('save_to_level')) {
    const levelName = new PropertiesParser(File.readFrom(PATH_SERVER_PROPERTIES)).get('level-name')
    if (levelName) {
        DIR_LEVEL_ROOT = 'worlds/' + levelName + '/'
        PATH_DATA = DIR_LEVEL_ROOT + 'residence'
    } else {
        logger.warn('无法获取存档名称: 读取 server.properties:level-name 时失败，将使用 ' + DIR_LEVEL_ROOT + ' 作为数据根目录')
    }
}

var rData

// #region 事件监听

mc.listen('onServerStarted', () => {
    conf.init('max_height', 64)
    conf.init('max_width', 128)
    conf.init('max_area', 0)
    conf.init('max_volume', 0)
    conf.init('min_height', 3)
    conf.init('min_width', 3)
    conf.init('min_area', 0)
    conf.init('min_volume', 0)
    conf.init('cost_per_block', 5)
    conf.init('allow_teleport', true)
    conf.init('teleport_cost', 0)
    conf.init('allow_transfer', true)
    conf.init('transfer_cost', 100)
    conf.init('transfer_cost_type', CostType.CONST)
    conf.init('recycling_proceeds_percent', 75)
    conf.init('max_residences_per_player', 0)
    conf.init('allow_use_admin_commands', true)
    conf.init('allow_create_residence_in_the_overworld', true)
    conf.init('allow_create_residence_in_the_nether', true)
    conf.init('allow_create_residence_in_the_end', true)
    conf.init('rename_cost', 0)
    conf.init('name_max_length', 32)
    conf.init('name_allow_format_symbols', false)
    conf.init('world_residences_enabled', true)
    conf.init('allow_cross_dimension_teleport', true)
    conf.init('use_the_opposite_direction', false)

    rData = new KVDatabase(PATH_DATA)
    if (rData.listKey().indexOf('residences') === -1) {
        rData.set('residences', [])
    }
    if (rData.listKey().indexOf('protected_areas') === -1) {
        rData.set('protected_areas', [
            {
                name: '黑曜石平台',
                pos1: [102, 0, 2, 2],
                pos2: [98, 256, -2, 2],
                id: guid()
            },
            {
                name: '返回传送门',
                pos1: [-3, 0, 3, 2],
                pos2: [3, 256, -3, 2],
                id: guid()
            }
        ])
    }

    // #region 普通命令注册

    let cmd = mc.newCommand(conf.get('command'), Plugin.name + ' 领地管理', PermType.Any)
    let enumCreate = ['create', 'cancel', 'list']
    let enumRemove = ['remove']
    let enumPublicPrem = ['pubperm']
    let enumPerms = []
    for (const key in ResidencePermName) {
        enumPerms.push(key)
    }

    cmd.setEnum('create', enumCreate)
    cmd.setEnum('remove', enumRemove)
    cmd.setEnum('public_perm', enumPublicPrem)
    cmd.setEnum('perms', enumPerms)

    cmd.mandatory('action', ParamType.Enum, 'create')
    cmd.mandatory('action', ParamType.Enum, 'remove')
    cmd.mandatory('action', ParamType.Enum, 'public_perm')
    cmd.optional('name_rt', ParamType.RawText)
    cmd.mandatory('name_s', ParamType.String)
    cmd.mandatory('perm', ParamType.Enum, 'perms')
    cmd.mandatory('value', ParamType.Bool)

    cmd.overload(['create'])
    cmd.overload(['remove', 'name_rt'])
    cmd.overload(['public_perm', 'name_s', 'perm', 'value'])
    cmd.overload([])

    cmd.setCallback((cmd, ori, outp, res) => {
        const pl = ori.player
        if (!pl) {
            outp.error('命令只能由玩家执行。')
            return
        }
        if (!res.action) {
            openResidenceGui(pl)
        }
        switch (res.action) {
            case 'create': {
                createResidence(pl, outp, false)
                break;
            }
            case 'cancel': {
                cancelCreateResidence(pl, outp)
                break;
            }
            case 'list': {
                listResidences(pl, outp)
                break;
            }
            case 'remove': {
                removeResidenceByName(pl, res.name_rt, outp)
                break;
            }
            case 'pubperm': {
                setPublicPerm(pl, res.name_s, res.perm, res.value, outp)
            }
        }
    })
    cmd.setup()

    // #endregion

    // #region 管理员命令注册

    if (conf.get('allow_use_admin_commands')) {
        cmd = mc.newCommand(conf.get('command') + 'admin', Plugin.name + ' 领地管理(管理员)', PermType.GameMasters)

        let enumCreate = ['create', 'cancel']
        let enumList = ['list']
        let enumRemove = ['remove']
        cmd.setEnum('create', enumCreate)
        cmd.setEnum('list', enumList)
        cmd.setEnum('remove', enumRemove)

        cmd.mandatory('action', ParamType.Enum, 'create')
        cmd.mandatory('action', ParamType.Enum, 'list')
        cmd.mandatory('action', ParamType.Enum, 'remove')
        cmd.mandatory('player', ParamType.Player)
        cmd.mandatory('name_rt', ParamType.RawText)
        cmd.mandatory('from', ParamType.BlockPos)
        cmd.mandatory('to', ParamType.BlockPos)

        cmd.overload(['create'])
        cmd.overload(['list', 'player'])
        cmd.overload(['remove'])
        cmd.overload(['remove', 'player', 'name_rt'])
        cmd.overload([])

        cmd.setCallback((cmd, ori, outp, res) => {
            const pl = ori.player
            if (res.action != 'list' && res.action != 'remove' && !pl) {
                outp.error('命令只能由玩家执行。')
            }
            if (!res.action) {
                openAdminGui(pl)
                return
            }
            switch (res.action) {
                case 'create': {
                    createResidence(pl, outp, true)
                    break;
                }
                case 'cancel': {
                    cancelCreateResidence(pl, outp)
                    break;
                }
                case 'list': {
                    if (res.player.length === 0) {
                        outp.error('没有与选择器匹配的目标。')
                        return;
                    }
                    if (res.player.length > 1) {
                        outp.error('与选择器匹配的目标过多。')
                        return;
                    }
                    const pl = res.player[0]
                    const reses = getResidencesByPlayer(pl)
                    if (reses.length === 0) {
                        outp.success(pl.realName + ' 没有任何领地。')
                    } else {
                        outp.success(pl.realName + ' 所有的领地:\n' + reses.map(res => res.name + ' (' + DimensionName[res.pos1[3]] + ')').join('\n'))
                    }
                    break;
                }
                case 'remove': {
                    const players = res.player
                    const name = res.name_rt
                    if (!pl && players == void 0) {
                        outp.error('请指定一个玩家。')
                        return
                    }
                    let resi
                    let player
                    if (players != void 0) {
                        if (players.length === 0) {
                            outp.error('没有与选择器匹配的目标。')
                            return;
                        }
                        if (players.length > 1) {
                            outp.error('与选择器匹配的目标过多。')
                            return;
                        }
                        player = players[0]
                        resi = getResidenceByName(player, name)
                    } else {
                        resi = getResidenceByPos(pl.blockPos)
                        if (resi) {
                            player = new OccupyingPlayer(resi.owner)
                        }
                    }
                    if (!resi) {
                        outp.error('请输入正确的领地名称或处在领地内。')
                        return false
                    }
                    pl.sendModalForm('确认移除领地', '你确定要移除 ' + player.realName + ' 的领地 ' + resi.name + ' 吗？', '确定移除', '取消', (player, rez) => {
                        if (rez == true) {
                            if (_removeResidence(resi)) {
                                let text = '领地 ' + resi.name + ' 已移除。'
                                pl.tell(text)
                            } else {
                                pl.tell('移除领地失败。')
                            }
                        }
                    })
                    break;
                }
            }
        })

        cmd.setup()
    }

    // #endregion

    // #region 保护区命令注册

    {
        cmd = mc.newCommand(conf.get('command') + 'pa', Plugin.name + ' 受保护地区管理', PermType.GameMasters)

        let enumAdd = ['add']
        let enumList = ['list']
        let enumRemove = ['remove']
        let enumRename = ['rename']

        cmd.setEnum('add', enumAdd)
        cmd.setEnum('list', enumList)
        cmd.setEnum('remove', enumRemove)
        cmd.setEnum('rename', enumRename)

        cmd.mandatory('action', ParamType.Enum, 'add')
        cmd.mandatory('action', ParamType.Enum, 'list')
        cmd.mandatory('action', ParamType.Enum, 'remove')
        cmd.mandatory('action', ParamType.Enum, 'rename')
        cmd.mandatory('name_s', ParamType.String)
        cmd.mandatory('name_rt', ParamType.RawText)
        cmd.mandatory('from', ParamType.BlockPos)
        cmd.mandatory('to', ParamType.BlockPos)

        cmd.overload(['list'])
        cmd.overload(['remove', 'name_rt'])
        cmd.overload(['add', 'from', 'to', 'name_rt'])
        cmd.overload(['rename', 'name_s', 'name_rt'])

        cmd.setCallback((cmd, ori, outp, res) => {
            /**
             * @type {ProtectedArea[]}
             */
            const pas = getProtectedAreas() || []
            switch (res.action) {
                case 'list': {
                    if (pas.length === 0) {
                        outp.success('没有任何受保护区域。')
                        return
                    }
                    outp.success('所有受保护区域:\n' + pas.map(pa => pa.name + ' (' + pa.getDimName() + ' ' + pa.getAABB().getRangeString() + ')').join('\n'))
                    break;
                }
                case 'add':
                case 'push': {
                    const from = res.from
                    const to = res.to
                    const name = res.name_rt
                    if (getProtectedAreaByName(name)) {
                        outp.error('已存在同名的受保护区域。')
                        return
                    }
                    const pa = new ProtectedArea({
                        pos1: [from.x, from.y, from.z, from.dimid],
                        pos2: [to.x, to.y, to.z, to.dimid],
                        name: name,
                        id: guid()
                    })
                    addProtectedArea(pa)
                    outp.success('受保护区域 ' + name + ' 已添加。')
                    break;
                }
                case 'remove': {
                    const name = res.name_rt
                    const pa = getProtectedAreaByName(name)
                    if (!pa) {
                        outp.error('受保护区域未找到。')
                        return
                    }
                    removeProtectedArea(pa)
                    outp.success('受保护区域 ' + name + ' 已被移除。')
                    break;
                }
                case 'rename': {
                    const name = res.name_s
                    const name2 = res.name_rt
                    const pa = getProtectedAreaByName(name)
                    if (!pa) {
                        outp.error('受保护区域未找到。')
                        return
                    }
                    if (getProtectedAreaByName(name2)) {
                        outp.error('已存在同名的受保护区域。')
                        return
                    }
                    pa.name = name2
                    putProtectedArea(pa)
                    outp.success('受保护区域 ' + name + ' 已被重命名为 ' + name2 + '。')
                    break;
                }
            }
        })

        cmd.setup()
    }

    // #endregion

    log('v' + Plugin.ver)
})

mc.listen('onJoin', pl => {
    pl.setExtraData('levi_residence', {})
})

mc.listen('onPreJoin', pl => {
    pl.setExtraData('levi_residence', {})
})

mc.listen('onChangeDim', pl => {
    cancelCreateResidence(pl)
})

mc.listen('onPlayerDie', pl => {
    cancelCreateResidence(pl)
})

mc.listen('onAttackBlock', (pl, bl) => {
    if (pl.getExtraData('levi_residence').start_pos) {
        createResidence(pl, void 0, getPlayerExtraData(pl).is_admin)
        return false
    }
})

mc.listen('onDestroyBlock', (pl, bl) => {
    if (!verifyResidencePerm(pl, bl.pos, 'destroy_block')) return tellNoResPerm(pl, 'destroy_block')
    if (pl.getExtraData('levi_residence').start_pos) {
        return false
    }
})
mc.listen('onPlaceBlock', (pl, bl) => {
    const permName = 'place_block'
    if (!verifyResidencePerm(pl, bl.pos, permName) || !verifyResidencePerm(pl, pl.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onOpenContainer', (pl, bl) => {
    const permName = 'open_container'
    const permName2 = 'open_ender_chest'
    const permName3 = 'use_workbench'
    if (bl.type === 'minecraft:ender_chest') {
        if (!verifyResidencePerm(pl, bl.pos, permName2)) return tellNoResPerm(pl, permName2)
    } else if (bl.type in workbenches) {
        if (!verifyResidencePerm(pl, bl.pos, permName3)) return tellNoResPerm(pl, permName3)
    } else if (!verifyResidencePerm(pl, bl.pos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onUseRespawnAnchor', (pl, pos) => {
    const permName = 'use_respawn_anchor'
    if (!verifyResidencePerm(pl, pos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onPlayerPullFishingHook', (pl, en) => {
    const permName = 'pull_fishing_hook'
    if (!verifyResidencePerm(pl, en.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onBedEnter', (pl, pos) => {
    const permName = 'enter_bed'
    if (!verifyResidencePerm(pl, pos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onChat', pl => {
    const permName = 'chat'
    if (!verifyResidencePerm(pl, pl.blockPos, permName)) return tellNoResPerm(pl, permName, true)
})
mc.listen('onAttackEntity', (pl, en) => {
    const permName = 'attack_entity'
    const permName2 = 'attack_player'
    if (en.isPlayer()) {
        if (!verifyResidencePerm(pl, en.blockPos, permName2)) return tellNoResPerm(pl, permName2)
    } else {
        if (!verifyResidencePerm(pl, en.blockPos, permName)) return tellNoResPerm(pl, permName)
    }
})
mc.listen('onUseItem', (pl) => {
    const permName = 'use_item'
    if (!verifyResidencePerm(pl, pl.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onUseItemOn', (pl) => {
    const permName = 'use_item_on_block'
    if (!verifyResidencePerm(pl, pl.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onUseBucketPlace', (pl, it, bl) => {
    const permName = 'bucket_place'
    if (!verifyResidencePerm(pl, pl.blockPos, permName) ||
        !verifyResidencePerm(pl, bl.pos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onUseBucketTake', (pl, it, target) => {
    const permName = 'bucket_take'
    if (target.blockPos) {
        if (!verifyResidencePerm(pl, target.blockPos, permName)) return tellNoResPerm(pl, permName)
    } else if (!verifyResidencePerm(pl, target.pos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onTakeItem', (pl, en) => {
    const permName = 'take_item'
    if (!verifyResidencePerm(pl, en.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onDropItem', (pl) => {
    const permName = 'drop_item'
    if (!verifyResidencePerm(pl, pl.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onEat', (pl) => {
    const permName = 'eat'
    if (!verifyResidencePerm(pl, pl.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onChangeArmorStand', (en, pl) => {
    const permName = 'change_armor_stand'
    if (!verifyResidencePerm(pl, en.blockPos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onSpawnProjectile', (en) => {
    const permName = 'player_spawn_projectile'
    if (en.isPlayer()) {
        if (!verifyResidencePerm(en.toPlayer(), en.blockPos, permName)) return tellNoResPerm(en.toPlayer(), permName)
    }
})
mc.listen('onStepOnPressurePlate', (en, bl) => {
    const permName = 'player_step_on_pressure_plate'
    if (en.isPlayer()) {
        if (!verifyResidencePerm(en.toPlayer(), bl.pos, permName)) return tellNoResPerm(en.toPlayer(), permName)
    }
})
mc.listen('onRide', (en, en2) => {
    const permName = 'player_ride_entity'
    if (en.isPlayer()) {
        if (!verifyResidencePerm(en.toPlayer(), en2.blockPos, permName)) return tellNoResPerm(en.toPlayer(), permName)
    }
})
mc.listen('onWitherBossDestroy', (en, AAbb, aaBB) => {
    const aabb = new AABB(AAbb, aaBB, AAbb.dimid)
    const reses = getResidences()
    for (const res of reses) {
        if (res.isAABBOverlap(aabb) && !res.getSettings().allow_wither_boss_destroy) {
            return false
        }
    }
})
mc.listen('onMobTrySpawn', (tn, pos) => {
    const reses = getResidences()
    for (const res of reses) {
        if (res.isContain(pos) && !res.getSettings().allow_mob_spawn) {
            return false
        }
    }
})
mc.listen('onEntityExplode', (en, pos, r) => {
    const reses = getResidences()
    const aabb = createAABBFromCenter(pos, r)
    for (const res of reses) {
        if (res.isAABBOverlap(aabb) && !res.getSettings().allow_entity_explode) {
            return false
        }
    }
})
mc.listen('onUseFrameBlock', (pl, bl) => {
    const permName = 'use_frame_block'
    if (!verifyResidencePerm(pl, bl.pos, permName)) return tellNoResPerm(pl, permName)
})
mc.listen('onBlockExplode', (bl, pos, r) => {
    const reses = getResidences()
    const aabb = createAABBFromCenter(pos, r)
    for (const res of reses) {
        if (res.isAABBOverlap(aabb) && !res.getSettings().allow_block_explode) {
            return false
        }
    }
})
mc.listen('onFireSpread', (pos) => {
    const reses = getResidences()
    for (const res of reses) {
        if (res.isContain(pos) && !res.getSettings().allow_fire_spread) {
            return false
        }
    }
})
mc.listen('onRespawnAnchorExplode', (pos, pl) => {
    if (getResidenceByPos(pos)) {
        if (!getResidenceByPos(pos).getSettings().allow_respawn_anchor_explode) return false
    }
})
mc.listen('onBlockInteracted', (pl, bl) => {
    const permName = 'interact_block'
    if (!verifyResidencePerm(pl, bl.pos, permName)) return tellNoResPerm(pl, permName)
})

// endregion

// #region 函数

const tickIntervals = []
mc.listen('onTick', () => {
    for (const listener of tickIntervals) {
        listener.counter++
        if (listener.counter >= listener.interval) {
            listener.counter = 0
            listener.callback()
        }
    }
})

/**
 * 获取玩家额外数据
 * @param {Player} pl 玩家
 * @returns {Object} 玩家额外数据
 */
function getPlayerExtraData(pl) {
    let data = pl.getExtraData('levi_residence')
    if (data) {
        return data
    } else {
        pl.setExtraData('levi_residence', {})
        return {}
    }
}

/**
 * 设置玩家额外数据
 * @param {Player} pl 玩家
 * @param {String} key 键
 * @param {any} value 值
 */
function setPlayerExtraData(pl, key, value) {
    const data = getPlayerExtraData(pl)
    data[key] = value
    pl.setExtraData('levi_residence', data)
}

/**
 * 获取所有领地
 * @returns {Residence[]} 领地数组
 */
function getResidences() {
    const data = rData.get('residences')
    return data.map(obj => new Residence(obj))
}

/**
 * 获取玩家的所有领地
 * @param {Player} pl 玩家
 * @returns {Residence[]} 领地数组
 */
function getResidencesByPlayer(pl) {
    const data = getResidences()
    return data.filter(res => res.owner === pl.realName)
}

function getWorldResidences() {
    if (conf.get('world_residences_enabled')) {
        const data = getResidences()
        return data.filter(res => res.getSettings().allow_residence_be_discovered == true)
    }
    return []
}

/**
 * 添加一个受保护区域
 * @param {ProtectedArea} pa 受保护区域
 */
function addProtectedArea(pa) {
    const data = rData.get('protected_areas')
    data.forEach(p => {
        if (p.id === pa.id) {
            return
        }
    })
    data.push(pa)
    rData.set('protected_areas', data)
}

/**
 * 移除一个受保护区域
 * @param {ProtectedArea} pa 受保护区域
 */
function removeProtectedArea(pa) {
    const data = rData.get('protected_areas')
    const index = data.findIndex(p => p.id === pa.id)
    if (index !== -1) {
        data.splice(index, 1)
        rData.set('protected_areas', data)
    }
}

function putProtectedArea(pa) {
    const data = rData.get('protected_areas')
    const index = data.findIndex(p => p.id === pa.id)
    if (index !== -1) {
        data[index] = pa
        rData.set('protected_areas', data)
    }
}

function getProtectedAreaByName(name) {
    return getProtectedAreas().find(pa => pa.name === name)
}

/**
 * 添加一个tick监听器
 * @param {Number} interval 间隔(tick)
 * @param {Function} callback 回调函数
 */
function addTickListener(interval, callback) {
    tickIntervals.push({
        interval: interval,
        counter: 0,
        callback: callback
    })
}

// #region Tick 监听器

addTickListener(4, () => {
    mc.getOnlinePlayers().forEach(pl => {
        const data = getPlayerExtraData(pl)
        if (data.start_pos) {
            let pos = pl.blockPos
            if (data.end_pos) {
                pos = data.end_pos
            }
            new CubicParticlePointSet(data.start_pos, pos).forEach(p => {
                mc.spawnParticle(p, 'minecraft:endrod')
            })
        }
    })
})

const lastResidences = {}
addTickListener(5, () => {
    mc.getOnlinePlayers().forEach(pl => {
        let lastResidence = lastResidences[pl.realName]
        let nowResidence = getResidenceByPos(pl.blockPos)
        if (!lastResidence && nowResidence || (lastResidence && nowResidence && nowResidence.id !== lastResidence.id)) {
            if (nowResidence.getSettings().show_tips_on_enter) {
                pl.setTitle('进入领地 ' + nowResidence.name, 4, 0, 20, 10)
            }
        }
        if (lastResidence && nowResidence && nowResidence.id == lastResidence.id) {
            if (nowResidence.getSettings().always_show_residence_name) {
                pl.tell(nowResidence.name, 5)
            }
        }
        lastResidences[pl.realName] = nowResidence
    })
})

// #endregion

/**
 * 获取玩家的领地
 * @param {Player} pl 玩家
 * @param {String} name 领地名称
 * @returns {Residence} 领地
 */

/**
 * 创建一个新的领地对象
 * @param {Player} pl 玩家
 * @param {String} name 领地名称
 * @param {IntPos} pos1 第一个点
 * @param {IntPos} pos2 第二个点
 * @returns {Residence} 领地
 */
function newResidence(pl, name, pos1, pos2) {
    const res = new Residence({
        name: name,
        owner: pl.realName,
        owner_xuid: pl.xuid,
        owner_uuid: pl.uuid,
        pos1: [pos1.x, pos1.y, pos1.z, pos1.dimid],
        pos2: [pos2.x, pos2.y, pos2.z, pos2.dimid],
        admins: [],
        members: [],
        id: guid(),
        public_perm: {
            chat: true,
            attack_entity: false,
            use_item: true,
            use_item_on_block: true,
            bucket_place: false,
            bucket_take: false,
            take_item: true,
            drop_item: true,
            eat: true,
            destroy_block: false,
            place_block: false,
            open_container: false,
            use_respawn_anchor: false,
            pull_fishing_hook: false,
            enter_bed: false,
            interact_entity: false,
            player_spawn_projectile: false,
            player_step_on_pressure_plate: false,
            player_ride_entity: false,
            change_armor_stand: false,
            use_workbench: true,
            open_ender_chest: true,
            interact_block: true,
            use_frame_block: false
        },
        private_perm: {},
        settings: {
            show_tips_on_enter: true,
            always_show_residence_name: true,
            allow_residence_be_discovered: false,
            allow_members_teleport: conf.get('allow_teleport'),
            allow_wither_boss_destroy: false,
            allow_mob_spawn: true,
            allow_entity_explode: false,
            allow_block_explode: false,
            allow_fire_spread: false,
        }
    })
    res.cost = res.getCost()
    return res
}

function tellE(pl, msg) {
    pl.tell('§c' + msg)
}
function tellW(pl, msg) {
    pl.tell('§e' + msg)
}

function getProtectedAreas() {
    return rData.get('protected_areas').map(obj => new ProtectedArea(obj))
}

/**
 * 添加一个领地
 * @param {Residence} res 领地
 */
function addResidence(res) {
    const data = rData.get('residences')
    data.push(res)
    rData.set('residences', data)
}

function putResidence(res) {
    const data = rData.get('residences')
    const index = data.findIndex(r => r.id === res.id)
    if (index !== -1) {
        data[index] = res
        rData.set('residences', data)
    }
}

function getResidenceByPos(pos) {
    const reses = getResidences()
    return reses.find(res => res.isContain(pos))
}

function verifyResidencePerm(pl, pos, perm) {
    const res = getResidenceByPos(pos)
    if (!res) {
        return true
    }
    return res.getPerms().verify(pl, perm)
}

function getResidenceByName(pl, name) {
    const reses = getResidencesByPlayer(pl)
    return reses.find(res => res.name === name)
}

function getResidenceByNameAdmin(pl, name) {
    const reses = getResidences()
    return reses.find(res =>
        res.name === name &&
        (res.owner === pl.realName || res.admins.includes(pl.realName))
    )
}

function getResidencesOnlyAdmin(pl) {
    const reses = getResidences()
    return reses.filter(res =>
        res.admins.includes(pl.realName)
    )
}

function getResidencesOnlyMember(pl) {
    const reses = getResidences()
    return reses.filter(res =>
        res.members.includes(pl.realName)
    )
}

function guid() {
    return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".replace(/[x]/g, () =>
        Math.floor(Math.random() * 16)
            .toString(16)
            .toUpperCase()
    )
}

function _removeResidence(res) {
    const data = rData.get('residences')
    const index = data.findIndex(r => r.name === res.name && r.id === res.id)
    if (index !== -1) {
        data.splice(index, 1)
        rData.set('residences', data)
        return true
    }
    return false
}

function setPublicPerm(pl, resName, perm, value, outp) {
    const res = getResidenceByNameAdmin(pl, resName)
    if (!res) {
        if (outp) {
            outp.error('请输入正确的领地名称。')
        }
        return false
    }
    res.setPublicPerm(perm, value)
    if (outp) {
        outp.success('领地的' + ResidencePermName[perm] + '权限已设置为 ' + value)
    }
}

function tellNoResPerm(pl, perm, isChating = false) {
    if (isChating) tellE(pl, '此领地未启用' + ResidencePermName[perm] + '。')
    else pl.setTitle('§c此领地未启用' + ResidencePermName[perm], 4, 0, 20, 10)
    return false
}

/**
 * 根据中心点和半径创建AABB
 * @param {FloatPos} center 中心点
 * @param {number} radius 半径
 * @returns {AABB} aabb
 */
function createAABBFromCenter(center, radius) {
    const minX = Math.floor(center.x - radius);
    const minY = Math.floor(center.y - radius);
    const minZ = Math.floor(center.z - radius);
    const maxX = Math.ceil(center.x + radius);
    const maxY = Math.ceil(center.y + radius);
    const maxZ = Math.ceil(center.z + radius);

    const min = { x: minX, y: minY, z: minZ };
    const max = { x: maxX, y: maxY, z: maxZ };
    return new AABB(min, max, center.dimid);
}



/**
 * 创建领地
 * @param {Player} pl 玩家
 * @param {CommandOutput} outp 输出
 * @param {boolean} isAdmin 是否为管理员
 */
function createResidence(pl, outp, isAdmin) {
    let resName = ''
    const pos = pl.blockPos
    if (getPlayerExtraData(pl).start_pos) {
        setPlayerExtraData(pl, 'end_pos', pos)
        isAdmin = getPlayerExtraData(pl).is_admin

        const startPos = getPlayerExtraData(pl).start_pos
        const res = newResidence(pl, 'temp', startPos, pos)
        const length = res.getLength()
        const width = res.getWidth()
        const height = res.getHeight()
        const area = res.getArea()
        const volume = res.getVolume()
        const cost = res.getCost()

        const TITLE = '圈地信息'
        const CONTENT = `体积: ${volume} (${length}*${width}*${height})
面积: ${area} (${length}*${width})
价格: ${cost}`

        let canCreate = true
        let reason = '\n\n§c'

        if (!isAdmin) {
            if (conf.get('max_height') > 0 && height > conf.get('max_height')) {
                canCreate = false
                reason += '领地高度不能超过 ' + conf.get('max_height') + '\n'
            }
            if (conf.get('max_width') > 0 && (width > conf.get('max_width') || length > conf.get('max_width'))) {
                canCreate = false
                reason += '领地长/宽度不能超过 ' + conf.get('max_width') + '\n'
            }
            if (conf.get('max_area') > 0 && area > conf.get('max_area')) {
                canCreate = false
                reason += '领地面积不能超过 ' + conf.get('max_area') + '\n'
            }
            if (conf.get('max_volume') > 0 && volume > conf.get('max_volume')) {
                canCreate = false
                reason += '领地体积不能超过 ' + conf.get('max_volume') + '\n'
            }
            if (conf.get('min_height') > 0 && height < conf.get('min_height')) {
                canCreate = false
                reason += '领地高度不能小于 ' + conf.get('min_height') + '\n'
            }
            if (conf.get('min_width') > 0 && (width < conf.get('min_width') || length < conf.get('min_width'))) {
                canCreate = false
                reason += '领地长/宽度不能小于 ' + conf.get('min_width') + '\n'
            }
            if (conf.get('min_area') > 0 && area < conf.get('min_area')) {
                canCreate = false
                reason += '领地面积不能小于 ' + conf.get('min_area') + '\n'
            }
            if (conf.get('min_volume') > 0 && volume < conf.get('min_volume')) {
                canCreate = false
                reason += '领地体积不能小于 ' + conf.get('min_volume') + '\n'
            }
            let protectedAreas = []
            getProtectedAreas().forEach(area => {
                if (area.isIn(res)) {
                    canCreate = false
                    protectedAreas.push(area.name)
                }
            })
            if (protectedAreas.length > 0) {
                reason += '领地不能与受保护区域(' + protectedAreas.join(', ') + ')重叠\n'
            }
        }
        let x = []
        getResidences().forEach(r => {
            if (r.isOverlapWith(res)) {
                canCreate = false
                x += r
            }
        })
        if (x.length > 0) {
            reason += '领地不能与其他领地重叠\n'
        }
        if (cost > pl.getMoney() && !isAdmin) {
            canCreate = false
            reason += '金钱不足(' + pl.getMoney() + ')\n'
        }

        if (canCreate) {
            function showInfo() {
                pl.sendSimpleForm(TITLE, CONTENT, [
                    '下一步',
                    '继续圈地',
                    '§c结束圈地'
                ], [
                    'textures/ui/confirm',
                    'textures/ui/arrow_left',
                    'textures/ui/cancel'
                ], (player, id) => {
                    if (id === 2) {
                        cancelCreateResidence(pl)
                    } else if (id == 0) {
                        check()
                    } else {
                        setPlayerExtraData(pl, 'end_pos', null)
                    }
                })
            }
            function check() {
                let fm = mc.newCustomForm()
                let maxLengthStr = ''
                let canNotUseSymbolsStr = ''
                if (conf.get('name_max_length') > 0) {
                    maxLengthStr = '\n领地名称不能超过 ' + conf.get('name_max_length') + ' 个字'
                }
                if (!conf.get('name_allow_format_symbols')) {
                    canNotUseSymbolsStr = '\n领地名称不能包含格式化符号'
                }
                if (!resName) {
                    resName = pl.realName + '\'s residence'
                }
                fm.setTitle('确认领地')
                    .addLabel(CONTENT)
                    .addLabel('请输入领地名称' + maxLengthStr + canNotUseSymbolsStr + '\n领地名称不能与你已经拥有的领地重复\n点击提交按钮后将获得领地并扣除金钱。')
                    .addInput('领地名称', '', resName)
                pl.sendForm(fm, (player, data) => {
                    if (data === null || data === void 0) {
                        showInfo()
                        return
                    }
                    setPlayerExtraData(pl, 'end_pos', null)
                    resName = data[2]
                    if (resName.length === 0) {
                        tellE(pl, '领地名称不能为空。')
                        return
                    }
                    if (conf.get('name_max_length') > 0 && resName.length > conf.get('name_max_length')) {
                        tellE(pl, '领地名称不能超过 ' + conf.get('name_max_length') + ' 个字。')
                        return
                    }
                    if (!conf.get('name_allow_format_symbols') && resName.indexOf('§') !== -1) {
                        tellE(pl, '领地名称不能包含格式化符号。')
                        return
                    }
                    if (getResidences().find(r => r.name === resName)) {
                        tellE(pl, '领地名称不能与你已经拥有的领地重复。')
                        return
                    }
                    if (cost > pl.getMoney() && !isAdmin) {
                        tellE(pl, '金钱不足，无法创建领地。')
                        return
                    }
                    if (conf.get('max_residences_per_player') > 0 && getResidencesByPlayer(pl).length >= conf.get('max_residences_per_player') && !isAdmin) {
                        tellE(pl, '无法创建更多领地。')
                        return
                    }
                    res.setName(resName)
                    resName = ''
                    addResidence(res)
                    if (!isAdmin) {
                        pl.reduceMoney(cost)
                    }
                    setPlayerExtraData(pl, 'start_pos', null)
                    setPlayerExtraData(pl, 'end_pos', null)
                    pl.tell('已创建领地: ' + res.name + "。")
                })
            }
            showInfo()
        } else {
            pl.sendSimpleForm(TITLE, CONTENT + reason + '因此你不能获得此领地。', [
                '继续圈地',
                '§c结束圈地'
            ], [
                'textures/ui/arrow_left',
                'textures/ui/cancel'
            ], (player, id) => {
                if (id === 1) {
                    cancelCreateResidence(pl)
                } else {
                    setPlayerExtraData(pl, 'end_pos', null)
                }
            })
        }
        return
    }
    if (!isAdmin) {
        if (!conf.get('allow_create_residence_in_the_' + Dimension[pos.dimid])) {
            if (outp) {
                outp.error('你不能在' + pos.dim + '创建领地。')
            } else {
                tellE(pl, '你不能在' + pos.dim + '创建领地。')
            }
            return
        }
        if (conf.get('max_residences_per_player') > 0 && getResidencesByPlayer(pl).length >= conf.get('max_residences_per_player')) {
            if (outp) {
                outp.error('无法创建更多领地。')
            } else {
                tellE(pl, '无法创建更多领地。')
            }
            return
        }
        let protectedAreas = []
        getProtectedAreas().forEach(area => {
            if (area.isInPos(pos)) {
                protectedAreas.push(area.name)
            }
        })
        if (protectedAreas.length > 0) {
            if (outp) {
                outp.error('你不能在受保护区域(' + protectedAreas.join(', ') + ')上创建领地。')
            } else {
                tellE(pl, '你不能在受保护区域(' + protectedAreas.join(', ') + ')上创建领地。')
            }
            return
        }
    }
    let feetRes = getResidenceByPos(pos)
    if (feetRes) {
        if (outp) {
            outp.error('领地不能与其他领地重叠。')
        } else {
            tellE(pl, '领地不能与其他领地重叠。')
        }
        return
    }
    setPlayerExtraData(pl, 'start_pos', pos)
    setPlayerExtraData(pl, 'end_pos', null)
    setPlayerExtraData(pl, 'is_admin', isAdmin)
    if (outp) {
        outp.success('已开始圈地，破坏方块或执行 /' + conf.get('command') + ' create 进行下一步。')
    } else {
        pl.tell('已开始圈地，破坏方块或执行 /' + conf.get('command') + ' create 进行下一步。')
    }
}

function cancelCreateResidence(pl, outp) {
    if (getPlayerExtraData(pl).start_pos) {
        setPlayerExtraData(pl, 'start_pos', null)
        setPlayerExtraData(pl, 'end_pos', null)
        if (outp) {
            outp.success('已结束圈地。')
        } else {
            pl.tell('已结束圈地。')
        }
    } else {
        if (outp) {
            outp.error('未开始圈地。')
        }
    }
}

/**
 * 列出玩家的领地
 * @param {Player} pl 玩家
 * @param {CommandOutput} outp 输出
 */
function listResidences(pl, outp) {
    const res = getResidencesByPlayer(pl)
    if (res.length === 0) {
        outp.error('你没有任何领地。')
        return
    }
    outp.success('你所有的领地:\n' + res.map(r => r.name + ' (' + DimensionName[r.pos1[3]] + ')').join('\n'))
}

/**
 * 移除一个领地
 * @param {Player} pl 玩家
 * @param {String} resName 领地名称
 */
function removeResidenceByName(pl, resName, outp) {
    let res
    if (!resName) {
        res = getResidenceByPos(pl.blockPos)
        if (res && res.owner !== pl.realName) {
            res = void 0
        }
    } else {
        res = getResidenceByName(pl, resName)
    }
    if (!res) {
        if (outp) {
            outp.error('请输入正确的领地名称或处在领地内。')
        }
        return false
    }

    if (res.owner === pl.realName) {
        let recyclingProceeds = res.getCost() * conf.get('recycling_proceeds_percent') / 100
        recyclingProceeds = Math.round(recyclingProceeds)
        pl.sendModalForm('确认移除领地', '你确定要移除领地 ' + res.name + ' 吗？\n这将会退还金钱 ' + recyclingProceeds + '。', '确定移除', '取消', (player, rez) => {
            if (rez == true) {
                if (_removeResidence(res)) {
                    let text = '领地 ' + res.name + ' 已移除'
                    if (recyclingProceeds > 0) {
                        text += '，并退还金钱 ' + recyclingProceeds
                    }
                    text += '。'
                    pl.tell(text)
                    pl.addMoney(recyclingProceeds)
                } else {
                    tellE(pl, '领地 ' + res.name + ' 移除失败。')
                }
            }
        })
    }
}
/**
 * 移除一个领地
 * @param {Player} pl 玩家
 * @param {Residence} res 领地
 */
function removeResidence(pl, res) {
    if (!res || res.owner !== pl.realName) {
        return
    }
    let recyclingProceeds = res.getCost() * conf.get('recycling_proceeds_percent') / 100
    recyclingProceeds = Math.round(recyclingProceeds)
    pl.sendModalForm('确认移除领地', '你确定要移除领地 ' + res.name + ' 吗？\n这将会退还金钱 ' + recyclingProceeds + '。', '确定移除', '取消', (player, rez) => {
        if (rez == true) {
            if (_removeResidence(res)) {
                let text = '领地 ' + res.name + ' 已移除'
                if (recyclingProceeds > 0) {
                    text += '，并退还金钱 ' + recyclingProceeds
                }
                text += '。'
                pl.tell(text)
                pl.addMoney(recyclingProceeds)
            } else {
                tellE(pl, '领地 ' + res.name + ' 移除失败。')
            }
        }
    })
}

/**
 * IntPos 到中心
 * @param {IntPos} pos 位置
 * @returns {FloatPos} 中心
 */
function intPosToCenter(pos) {
    return new FloatPos(
        pos.x + 0.5,
        pos.y + 0.5,
        pos.z + 0.5,
        pos.dimid
    )
}

function parseInt0(x) {
    let num = parseInt(x)
    if (isNaN(num)) {
        num = 0
    }
    if (num < 0) {
        num = 0
    }
    if (num > 2147483647) {
        num = 2147483647
    }
    return num
}

/**
 * 获取朝向
 * @param {DirectionAngle} d 偏航角
 * @returns {number} 朝向
 */
function getDirection(d) {
    if (d.pitch > 45) return 5
    if (d.pitch < -45) return 4
    return d.toFacing()
}

// #region GUI

function formHeader(pl) {
    return '金钱: ' + pl.getMoney()
}

/**
 * 打开 Gui
 * @param {Player} pl 
 */
function openResidenceGui(pl) {
    const res = getResidenceByPos(pl.blockPos)
    const myRes = getResidencesByPlayer(pl)
    const adminRes = getResidencesOnlyAdmin(pl)
    const memberRes = getResidencesOnlyMember(pl)
    const worldRes = getWorldResidences()
    const fm = mc.newSimpleForm()
    const buttons = []
    fm.setTitle(Plugin.name + ' 领地管理')
        .setContent(formHeader(pl))
    if (res && (res.owner === pl.realName || res.admins.includes(pl.realName))) {
        fm.addButton('当前领地', 'textures/ui/chat_down_arrow')
        buttons.push('当前领地')
    }
    if (myRes && myRes.length > 0) {
        fm.addButton('我的领地')
        buttons.push('我的领地')
    }
    if (adminRes && adminRes.length > 0) {
        fm.addButton('可管理领地', 'textures/ui/permissions_op_crown')
        buttons.push('可管理领地')
    }
    if (memberRes && memberRes.length > 0) {
        fm.addButton('可访问领地', 'textures/ui/permissions_member_star')
        buttons.push('可访问领地')
    }
    if (conf.get('world_residences_enabled') && worldRes && worldRes.length > 0) {
        fm.addButton('世界领地', 'textures/ui/World')
        buttons.push('世界领地')
    }
    fm.addButton('创建领地', 'textures/ui/color_plus')
    buttons.push('创建领地')
    fm.addButton('说明', 'textures/ui/realmsStoriesIcon')
    buttons.push('说明')
    pl.sendForm(fm, (pl, id) => {
        switch (buttons[id]) {
            case '说明': {
                const fm = mc.newSimpleForm()
                let text = ''
                for (let key in workbenches) {
                    text += '\n' + workbenches[key]
                }
                fm.setTitle('说明')
                    .setContent(formHeader(pl) + '\n\n§l工作方块:§r' + text)
                pl.sendForm(fm, () => {
                    openResidenceGui(pl)
                })
                break
            }
            case '我的领地': {
                GUI.myResidences(pl, openResidenceGui)
                break
            }
            case '创建领地': {
                createResidence(pl, null, false)
                break
            }
            case '可管理领地': {
                GUI.adminResidences(pl, openResidenceGui)
                break
            }
            case '可访问领地': {
                GUI.accessibleResidences(pl, openResidenceGui)
                break
            }
            case '世界领地': {
                GUI.worldResidences(pl, openResidenceGui)
                break
            }
            case '当前领地': {
                GUI.residenceInfo(pl, res, openResidenceGui)
                break
            }
        }
    })
}

/**
 * 打开管理员 Gui
 * @param {Player} pl 玩家
 */
function openAdminGui(pl) {
    const fm = mc.newSimpleForm()
    fm.setTitle(Plugin.name + ' 管理员菜单')
        .setContent('删除他人领地请使用 /' + conf.get('command') + 'admin remove\n管理受保护区域请使用 /' + conf.get('command') + 'pa')
        .addButton('配置项', 'textures/ui/icon_setting')
        .addButton('创建领地(管理员权限)', 'textures/ui/color_plus')
    pl.sendForm(fm, (pl, id) => {
        switch (id) {
            case 0: {
                GUI.config(pl, openAdminGui)
                break
            }
            case 1: {
                createResidence(pl, null, true)
                break
            }
        }
    })
}

const GUI = {
    myResidences: (pl, cb = () => { }) => {
        const reses = getResidencesByPlayer(pl)
        const fm = mc.newSimpleForm()
        fm.setTitle('我的领地')
            .setContent(formHeader(pl))
        reses.forEach(r => {
            fm.addButton(r.name)
        })
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                cb(pl)
                return
            }
            let res = reses[id]
            GUI.residenceInfo(pl, res, GUI.myResidences)
        })
    },
    /**
     * 显示领地信息
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     * @returns {void}
     */
    residenceInfo: (pl, res, cb = () => { }) => {
        if (res) {
            const fm = mc.newSimpleForm()
            let content = formHeader(pl) + '\n\n所有者: ' + res.owner
            const isOwner = res.owner === pl.realName
            const isAdmin = res.admins.includes(pl.realName)
            const isMember = res.members.includes(pl.realName)
            const isManager = isOwner || isAdmin
            const isAccessible = isOwner || isAdmin || isMember
            if (isOwner && res.admins.length > 0) {
                content += '\n管理员: ' + res.admins.join(', ')
            }
            if (isManager && res.members.length > 0) {
                content += '\n成员: ' + res.members.join(', ')
            }
            const buttons = []
            fm.setTitle(res.name)
                .setContent(content)

            let canTeleport = true
            let cost = 0
            let teleportExtraText = ''
            if (conf.get('teleport_cost') > 0) {
                cost = conf.get('teleport_cost')
                if (pl.getMoney() < cost) {
                    teleportExtraText = '\n§c需要花费 $' + cost + '，余额不足'
                    canTeleport = false
                } else {
                    teleportExtraText = '\n需要花费 $' + cost
                }
            }
            if (!conf.get('allow_cross_dimension_teleport') && pl.pos.dimid != res.pos2[3]) {
                canTeleport = false
                teleportExtraText = '\n§c无法跨维度传送'
            }
            if (isManager) {
                if (conf.get('allow_teleport')) {
                    fm.addButton('传送到领地' + teleportExtraText, 'textures/ui/send_icon')
                    buttons.push('传送')
                }
                fm.addButton('公共权限管理', 'textures/ui/permissions_visitor_hand')
                buttons.push('权限管理')
                fm.addButton('个人权限管理', 'textures/ui/permissions_custom_dots')
                buttons.push('个人权限管理')
                fm.addButton('设置', 'textures/ui/icon_setting')
                buttons.push('设置')
                fm.addButton('重命名', 'textures/ui/editIcon')
                buttons.push('重命名')
                if (isOwner) {
                    fm.addButton('领地管理员', 'textures/ui/permissions_op_crown')
                    buttons.push('领地管理员')
                }
                fm.addButton('领地成员', 'textures/ui/permissions_member_star')
                buttons.push('领地成员')
                if (res.isContain(pl.blockPos)) {
                    fm.addButton('设置传送点')
                    buttons.push('设置传送点')
                }
                fm.addButton('显示边界', 'textures/blocks/structure_air')
                buttons.push('显示边界')
            } else if (isMember) {
                if (res.getSettings().allow_members_teleport && conf.get('allow_teleport')) {
                    fm.addButton('传送到领地' + teleportExtraText, 'textures/ui/send_icon')
                    buttons.push('传送')
                }
                fm.addButton('显示边界', 'textures/blocks/structure_air')
                buttons.push('显示边界')
            }
            if (!buttons.includes('传送') && res.getSettings().allow_residence_be_discovered && conf.get('allow_teleport')) {
                fm.addButton('传送到领地', 'textures/ui/send_icon')
                buttons.push('传送')
            }
            if (!conf.get('allow_teleport')) {
                canTeleport = false
            }
            if (isOwner) {
                if (res.isContain(pl.blockPos)) {
                    fm.addButton('扩展领地', 'textures/blocks/structure_void')
                    buttons.push('扩展')
                }
                if (conf.get('allow_transfer')) {
                    fm.addButton('转让领地', 'textures/ui/share_microsoft')
                    buttons.push('转让')
                }
                fm.addButton('移除领地', 'textures/ui/book_trash_default')
                buttons.push('移除领地')
            }


            pl.sendForm(fm, (pl, id) => {
                if (id === null || id === void 0) {
                    cb(pl)
                    return
                }
                switch (buttons[id]) {
                    case '传送': {
                        if (canTeleport) {
                            pl.reduceMoney(cost)
                            pl.teleport(intPosToCenter(res.getTeleportPos()))
                        } else {
                            tellE(pl, '传送失败。')
                        }
                        break
                    }
                    case '设置传送点': {
                        pl.sendModalForm('设置传送点', '是否设置领地传送点为当前位置？', '是', '否', (player, rez) => {
                            if (rez) {
                                const pos = pl.blockPos
                                if (res.isContain(pos)) {
                                    res.setTeleportPos(pos)
                                    pl.tell('已设置领地 ' + res.name + ' 的传送点。')
                                }
                            } else {
                                GUI.residenceInfo(pl, res, cb)
                            }
                        })
                        break
                    }
                    case '设置': {
                        GUI.residenceSettings(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '权限管理': {
                        GUI.residencePublicPermissions(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '个人权限管理': {
                        GUI.residencePrivatePermissions(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '领地管理员': {
                        GUI.residenceAdmins(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '领地成员': {
                        GUI.residenceMembers(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '移除领地': {
                        removeResidence(pl, res)
                        break
                    }
                    case '显示边界': {
                        res.showBorder()
                        break
                    }
                    case '转让': {
                        GUI.transferResidence(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '扩展': {
                        GUI.expandResidence(pl, res, GUI.residenceInfo)
                        break
                    }
                    case '重命名': {
                        GUI.renameResidence(pl, res, GUI.residenceInfo)
                        break
                    }
                }
            })
        } else if (cb) {
            cb(pl)
        }
    },
    adminResidences: (pl, cb = () => { }) => {
        const reses = getResidencesOnlyAdmin(pl)
        const fm = mc.newSimpleForm()
        fm.setTitle('可管理领地')
            .setContent(formHeader(pl))
        reses.forEach(r => {
            fm.addButton(r.name + '\n' + r.owner)
        })
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                cb(pl)
                return
            }
            let res = reses[id]
            GUI.residenceInfo(pl, res, GUI.adminResidences)
        })
    },
    accessibleResidences: (pl, cb = () => { }) => {
        const reses = getResidencesOnlyMember(pl)
        const fm = mc.newSimpleForm()
        fm.setTitle('可访问领地')
            .setContent(formHeader(pl))
        reses.forEach(r => {
            fm.addButton(r.name + '\n' + r.owner)
        })
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                cb(pl)
                return
            }
            let res = reses[id]
            GUI.residenceInfo(pl, res, GUI.accessibleResidences)
        })
    },
    worldResidences: (pl, cb = () => { }) => {
        const reses = getWorldResidences()
        const fm = mc.newSimpleForm()
        fm.setTitle('世界领地')
            .setContent(formHeader(pl))
        reses.forEach(r => {
            fm.addButton(r.name + '\n' + r.owner)
        })
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                cb(pl)
                return
            }
            let res = reses[id]
            GUI.residenceInfo(pl, res, GUI.worldResidences)
        })
    },
    /**
     * 领地权限管理
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     */
    residenceSettings: (pl, res, cb = () => { }) => {
        if (res.owner !== pl.realName && !res.admins.includes(pl.realName)) {
            return
        }
        const fm = mc.newCustomForm()
        const tip = '更改设置后需要点击最底部的提交按钮才能生效。'
        const settings = []
        const settingNames = []
        for (let key in RescidenceSettingsName) {
            settings.push(key)
            settingNames.push(RescidenceSettingsName[key])
        }
        fm.setTitle('设置').addLabel(tip)
        settingNames.forEach((name, i) => {
            fm.addSwitch(name, res.getSettings()[settings[i]] == true)
        })
        fm.addLabel(tip)
        pl.sendForm(fm, (pl, data) => {
            if (data) {
                data.forEach((value, i) => {
                    if (i > 0 && i < data.length - 1) {
                        res.setSettingNoAutoSave(settings[i - 1], value)
                        putResidence(res)
                    }
                })
            }
            cb(pl, res)
        })
    },

    /**
     * 公共权限管理
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     * @returns {void}
     */
    residencePublicPermissions: (pl, res, cb = () => { }) => {
        if (res.owner !== pl.realName && !res.admins.includes(pl.realName)) {
            return
        }
        const fm = mc.newCustomForm()
        const tip = '更改权限后需要点击最底部的提交按钮才能生效。'
        const permissions = []
        const permissionNames = []
        for (let key in ResidencePermName) {
            permissions.push(key)
            permissionNames.push(ResidencePermName[key])
        }
        fm.setTitle('公共权限管理').addLabel(tip)
        permissionNames.forEach((name, i) => {
            fm.addSwitch(name, res.public_perm[permissions[i]] == true)
        })
        fm.addLabel(tip)
        pl.sendForm(fm, (pl, data) => {
            if (data) {
                data.forEach((value, i) => {
                    if (i > 0 && i < data.length - 1) {
                        res.setPublicPermNoAutoSave(permissions[i - 1], value)
                        putResidence(res)
                    }
                })
            }
            cb(pl, res)
        })
    },

    /**
     * 个人权限管理
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     * @returns {void}
     */
    residencePrivatePermissions: (pl, res, cb = () => { }) => {
        if (res.owner !== pl.realName && !res.admins.includes(pl.realName)) {
            return
        }
        GUI.playerSelector(pl, () => {
            cb(pl, res)
        }, (plObj, plName) => {
            const fm = mc.newCustomForm()
            const tip = '更改权限后需要点击最底部的提交按钮才能生效。\n必须在最下面打开覆盖其他权限才能生效。'
            const permissions = []
            const permissionNames = []
            for (let key in ResidencePermName) {
                permissions.push(key)
                permissionNames.push(ResidencePermName[key])
            }
            permissions.push('_override')
            permissionNames.push('§l覆盖其他权限(打开才能生效)')
            fm.setTitle(plName + ' 的权限管理').addLabel(tip)
            if (res.private_perm[plName] === void 0 || res.private_perm[plName] === null) {
                res.private_perm[plName] = {}
            }
            permissionNames.forEach((name, i) => {
                fm.addSwitch(name, res.private_perm[plName][permissions[i]] == true)
            })
            fm.addLabel(tip)
            pl.sendForm(fm, (pl, data) => {
                if (data) {
                    data.forEach((value, i) => {
                        if (i > 0 && i < data.length - 1) {
                            res.setPrivatePermNoAutoSave(plName, permissions[i - 1], value)
                            putResidence(res)
                        }
                    })
                }
                cb(pl, res)
            })
        })
    },

    playerSelector: (pl, failed = () => { }, cb = () => { }, excludes = []) => {
        const fm = mc.newSimpleForm()
        fm.setTitle('玩家选择器')
            .addButton('选择一名在线玩家')
            .addButton('选择一名离线或在线玩家')
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                failed()
                return
            }
            if (id === 0) {
                GUI.onlinePlayerSelector(pl, failed, cb, excludes)
            } else {
                GUI.allPlayerSelector(pl, failed, cb, excludes)
            }
        })
    },

    onlinePlayerSelector: (pl, failed = () => { }, cb = () => { }, excludes = []) => {
        const fm = mc.newSimpleForm()
        const players = mc.getOnlinePlayers()

        fm.setTitle('玩家选择器')
        players.forEach((pl, i) => {
            if (excludes.includes(pl.realName)) {
                players.splice(i, 1)
                return
            }
            fm.addButton(pl.realName)
        })

        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                failed()
                return
            }
            cb(players[id], players[id].realName)
        })
    },

    allPlayerSelector: (pl, failed = () => { }, cb = () => { }, excludes = []) => {
        const fm = mc.newSimpleForm()
        const players = data.getAllPlayerInfo()

        fm.setTitle('玩家选择器')
        players.forEach((pl, i) => {
            if (excludes.includes(pl.realName)) {
                players.splice(i, 1)
                return
            }
            fm.addButton(pl.name)
        })

        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                failed()
                return
            }
            cb(new OccupyingPlayer(players[id].name, players[i].xuid, players[i].uuid), players[id].name)
        })
    },

    listButtons(pl, title, values, cb, failed = () => { }) {
        const fm = mc.newSimpleForm()

        fm.setTitle(title)
        values.forEach(e => {
            fm.addButton(e)
        })

        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                failed()
                return
            }
            cb(values[id])
        })
    },
    /**
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     */
    residenceAdmins(pl, res, cb) {
        if (res.owner !== pl.realName) {
            return
        }
        const admins = res.getAdmins()
        const fm = mc.newSimpleForm()
        var content = '管理员可以: 编辑个人/公共权限, 管理成员, 编辑领地设置, 设置领地传送点, 重命名领地, 传送到领地, 允许所有公共权限, 显示领地边界'
        fm.setTitle('领地管理员')
            .addButton('添加管理员', 'textures/ui/color_plus')
            .addButton('移除管理员', 'textures/ui/dark_minus')
        if (admins.length > 0) {
            content += '\n\n' + admins.join(', ')
        }
        fm.setContent(content)
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                cb(pl, res)
                return
            }
            if (id === 0) {
                GUI.playerSelector(pl, () => {
                    cb(pl, res)
                }, (plObj, plName) => {
                    res.addAdmin(plName)
                    cb(pl, res)
                }, admins)
            } else {
                GUI.listButtons(pl, '移除管理员', admins, (plName) => {
                    res.removeAdmin(plName)
                    cb(pl, res)
                }, () => {
                    cb(pl, res)
                })
            }
        })
    },
    /**
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     */
    residenceMembers(pl, res, cb) {
        const members = res.getMembers()
        const fm = mc.newSimpleForm()
        var content = '成员可以: 传送到领地(如果允许), 允许所有公共权限(如果个人权限没有覆盖), 显示领地边界'
        fm.setTitle('领地成员')
            .addButton('添加成员', 'textures/ui/color_plus')
            .addButton('移除成员', 'textures/ui/dark_minus')
        if (members.length > 0) {
            content += '\n\n' + members.join(', ')
        }
        fm.setContent(content)
        pl.sendForm(fm, (pl, id) => {
            if (id === null || id === void 0) {
                cb(pl, res)
                return
            }
            if (id === 0) {
                GUI.playerSelector(pl, () => {
                    cb(pl, res)
                }, (plObj, plName) => {
                    res.addMember(plName)
                    cb(pl, res)
                }, members)
            } else {
                GUI.listButtons(pl, '移除成员', members, (plName) => {
                    res.removeMember(plName)
                    cb(pl, res)
                }, () => {
                    cb(pl, res)
                })
            }
        })
    },

    /**
     * 转让领地
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     * @returns {void}
     */
    transferResidence(pl, res, cb = () => { }) {
        if (res.owner !== pl.realName || !conf.get('allow_transfer')) {
            return
        }
        GUI.onlinePlayerSelector(pl, () => {
            cb(pl, res)
        }, (plObj, plName) => {
            let cost = conf.get('transfer_cost')
            if (conf.get('transfer_cost_type') == CostType.PERCENT) {
                cost = Math.round(res.getCost() * conf.get('transfer_cost') / 100)
            }
            let extraText = ''
            if (cost > 0) {
                extraText = '\n需要花费 $' + cost
            }
            pl.sendModalForm('转让领地', formHeader(pl) + '\n\n是否转让领地 ' + res.name + ' 给 ' + plName + ' 并将自己降级为领地管理员？' + extraText, '是', '否', (player, rez) => {
                if (rez) {
                    if (res.owner === plName || res.owner !== pl.realName) {
                        tellE(pl, '转让失败。')
                        return
                    }
                    if (!plObj) {
                        tellE(pl, '转让失败。')
                        return
                    }
                    if (getResidencesByPlayer(plObj).length >= conf.get('max_residences_per_player')) {
                        tellE(pl, '转让失败，' + plName + ' 领地数量已达上限。')
                    }
                    if (cost > 0 && pl.getMoney() < cost) {
                        tellE(pl, '转让失败，余额不足。')
                        return
                    }
                    pl.reduceMoney(cost)
                    res.owner = plObj.realName
                    res.owner_xuid = plObj.xuid
                    res.owner_uuid = plObj.uuid
                    res.addAdmin(pl.realName)
                    putResidence(res)
                    pl.tell('已转让领地 ' + res.name + ' 给 ' + plName + '。')
                } else {
                    cb(pl, res)
                }
            })
        }, [res.owner])
    },

    /**
     * 扩展领地
     * @param {Player} pl 玩家
     * @param {Residence} res 领地
     * @param {Function} cb 回调函数
     * @returns {void}
     */
    expandResidence(pl, res, cb = () => { }) {
        if (res.owner !== pl.realName) {
            return
        }
        let dir = getDirection(pl.direction)
        if (conf.get('use_the_opposite_direction')) {
            if (dir == 0) dir = 2
            else if (dir == 1) dir = 3
            else if (dir == 2) dir = 0
            else if (dir == 3) dir = 1
        }
        let dirText = DirectionName[dir]
        const fm = mc.newCustomForm().setTitle('扩展领地').addLabel(formHeader(pl) + '\n\n向' + dirText + '方扩展领地。\n如果方向是错的请联系管理员在 /' + conf.get('command') + 'admin 配置项最底部修改').addSlider('扩展格数', 1, 32, 1, 1)
        pl.sendForm(fm, (pl, data) => {
            if (!data) {
                cb(pl, res)
                return
            }
            let blocks = data[1]
            let newRes = res.copyObject()
            let rez = newRes.expand(dir, blocks)
            if (rez) {
                let cost = newRes.getCost() - res.getCost()
                if (cost > pl.getMoney()) {
                    tellE(pl, '扩展失败，余额不足 ' + cost + '。')
                    return
                }
                pl.sendModalForm('扩展领地', '是否向' + dirText + '扩展 ' + blocks + ' 格领地，需要花费 $' + cost, '是', '否', (player, rez) => {
                    if (rez) {
                        if (cost > pl.getMoney()) {
                            tellE(pl, '扩展失败，余额不足。')
                            return
                        }
                        pl.reduceMoney(cost)
                        putResidence(newRes)
                        pl.tell('已向' + dirText + '扩展 ' + blocks + ' 格领地。')
                        newRes.showBorder()
                        return
                    }
                    cb(pl, res)
                })
            } else {
                tellE(pl, '扩展失败。')
            }
        })
    },

    /**
     * @param {Player} pl 
     * @param {Function} cb 
     */
    config: (pl, cb = () => { }) => {
        if (!pl.isOP()) {
            return
        }
        const tip = '更改配置后需要点击最底部的提交按钮才能生效。'
        const fm = mc.newCustomForm()
            .setTitle('配置项')
            .addLabel(tip)
            .addInput('领地最大高度', '自然数, 0 为无限制', conf.get('max_height') + '')
            .addInput('领地最大宽度', '自然数, 0 为无限制', conf.get('max_width') + '')
            .addInput('领地最大面积', '自然数, 0 为无限制', conf.get('max_area') + '')
            .addInput('领地最大体积', '自然数, 0 为无限制', conf.get('max_volume') + '')
            .addInput('领地最小高度', '自然数', conf.get('min_height') + '')
            .addInput('领地最小宽度', '自然数', conf.get('min_width') + '')
            .addInput('领地最小面积', '自然数', conf.get('min_area') + '')
            .addInput('领地最小体积', '自然数', conf.get('min_volume') + '')
            .addInput('每格方块的价格', '自然数', conf.get('cost_per_block') + '')
            .addSwitch('允许传送到领地', conf.get('allow_teleport'))
            .addInput('传送花费', '自然数', conf.get('teleport_cost') + '')
            .addSwitch('允许跨维度传送', conf.get('allow_cross_dimension_teleport'))
            .addSwitch('允许转让领地', conf.get('allow_transfer'))
            .addInput('转让花费', '自然数', conf.get('transfer_cost') + '')
            .addDropdown('转让花费类型', ['固定价格', '领地价格的百分数'], conf.get('transfer_cost_type'))
            .addInput('领地回收(移除)的回报百分数', '自然数, 0 - 100', conf.get('recycling_proceeds_percent') + '')
            .addInput('每位玩家的最大领地数量', '自然数, 0 为无限制', conf.get('max_residences_per_player') + '')
            .addInput('领地名称最大长度', '自然数', conf.get('name_max_length') + '')
            .addSwitch('领地名称允许使用格式化符号(颜色符号)', conf.get('name_allow_format_symbols'))
            .addInput('重命名领地花费', '自然数', conf.get('rename_cost') + '')
            .addSwitch('允许在主世界创建领地', conf.get('allow_create_residence_in_the_overworld'))
            .addSwitch('允许在下界创建领地', conf.get('allow_create_residence_in_the_nether'))
            .addSwitch('允许在末地创建领地', conf.get('allow_create_residence_in_the_end'))
            .addSwitch('启用世界领地', conf.get('world_residences_enabled'))
            .addSwitch('使用相反的方向配置(如果扩展领地时方向不正确请打开此选项)', conf.get('use_the_opposite_direction'))
            .addLabel(tip)
        pl.sendForm(fm, (pl, data) => {
            if (!data) {
                cb(pl)
                return
            }
            let maxHeight = parseInt0(data[1])
            let maxWidth = parseInt0(data[2])
            let maxArea = parseInt0(data[3])
            let maxVolume = parseInt0(data[4])
            let minHeight = parseInt0(data[5])
            let minWidth = parseInt0(data[6])
            let minArea = parseInt0(data[7])
            let minVolume = parseInt0(data[8])
            let pricePerBlock = parseInt0(data[9])
            let allowTeleport = data[10]
            let teleportCost = parseInt0(data[11])
            let allowCrossDimensionTeleport = data[12]
            let allowTransfer = data[13]
            let transferCost = parseInt0(data[14])
            let transferCostType = data[15]
            let recyclingProceedsPercent = parseInt0(data[16])
            let maxResidencesPerPlayer = parseInt0(data[17])
            let nameMaxLength = parseInt0(data[18])
            let nameAllowFormatSymbols = data[19]
            let renameCost = parseInt0(data[20])
            let allowCreateResidenceInTheOverworld = data[21]
            let allowCreateResidenceInTheNether = data[22]
            let allowCreateResidenceInTheEnd = data[23]
            let worldResidencesEnabled = data[24]
            let useTheOppositeDirection = data[25]

            conf.set('max_height', maxHeight)
            conf.set('max_width', maxWidth)
            conf.set('max_area', maxArea)
            conf.set('max_volume', maxVolume)
            conf.set('min_height', minHeight)
            conf.set('min_width', minWidth)
            conf.set('min_area', minArea)
            conf.set('min_volume', minVolume)
            conf.set('cost_per_block', pricePerBlock)
            conf.set('allow_teleport', allowTeleport)
            conf.set('teleport_cost', teleportCost)
            conf.set('allow_cross_dimension_teleport', allowCrossDimensionTeleport)
            conf.set('allow_transfer', allowTransfer)
            conf.set('transfer_cost', transferCost)
            conf.set('transfer_cost_type', transferCostType)
            conf.set('recycling_proceeds_percent', recyclingProceedsPercent)
            conf.set('max_residences_per_player', maxResidencesPerPlayer)
            conf.set('name_max_length', nameMaxLength)
            conf.set('name_allow_format_symbols', nameAllowFormatSymbols)
            conf.set('rename_cost', renameCost)
            conf.set('allow_create_residence_in_the_overworld', allowCreateResidenceInTheOverworld)
            conf.set('allow_create_residence_in_the_nether', allowCreateResidenceInTheNether)
            conf.set('allow_create_residence_in_the_end', allowCreateResidenceInTheEnd)
            conf.set('world_residences_enabled', worldResidencesEnabled)
            conf.set('use_the_opposite_direction', useTheOppositeDirection)

            pl.tell('配置已更新。')
        })
    },

    renameResidence: (pl, res, cb = () => { }) => {
        let fm = mc.newCustomForm()
        let maxLengthStr = ''
        let canNotUseSymbolsStr = ''
        let costStr = ''
        if (conf.get('name_max_length') > 0) {
            maxLengthStr = '\n领地名称不能超过 ' + conf.get('name_max_length') + ' 个字'
        }
        if (!conf.get('name_allow_format_symbols')) {
            canNotUseSymbolsStr = '\n领地名称不能包含格式化符号'
        }
        let cost = conf.get('rename_cost')
        if (cost > 0) {
            costStr = '\n需要花费 $' + cost
        }
        fm.setTitle('重命名领地')
            .addLabel('请输入领地名称' + costStr + maxLengthStr + canNotUseSymbolsStr + '\n领地名称不能与你已经拥有的领地重复\n点击提交按钮后将重命名领地并扣除金钱。')
            .addInput('领地名称', '', res.name)
        pl.sendForm(fm, (player, data) => {
            if (data === null || data === void 0) {
                cb(pl, res)
                return
            }
            let resName = data[1]
            if (resName.length === 0) {
                tellE(pl, '领地名称不能为空。')
                return
            }
            if (conf.get('name_max_length') > 0 && resName.length > conf.get('name_max_length')) {
                tellE(pl, '领地名称不能超过 ' + conf.get('name_max_length') + ' 个字。')
                return
            }
            if (!conf.get('name_allow_format_symbols') && resName.indexOf('§') !== -1) {
                tellE(pl, '领地名称不能包含格式化符号。')
                return
            }
            if (getResidences().find(r => r.name === resName)) {
                tellE(pl, '领地名称与原名称相同或与你已经拥有的领地重复。')
                return
            }
            if (cost > 0 && pl.getMoney() < cost) {
                tellE(pl, '重命名失败，余额不足。')
                return
            }
            res.setName(resName)
            putResidence(res)
            pl.reduceMoney(cost)
            pl.tell('已重命名领地为 ' + resName + '。')
        })
    }
}

// #endregion
// #endregion