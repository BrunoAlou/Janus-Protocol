const IT_ROOM_NPCS_LIST = [
  {
    id: 'npc_it_alan',
    name: 'Alan',
    role: 'Suporte N1',
    group: 'team',
    textureKey: 'npc_it_aline',
    assetFile: 'ti_room_npcs/aline_sit.png',
    sitDirectionFlipX: true,
    scaleMultiplier: 2,
    x: 428,
    y: 188,
    areaWidth: 52,
    areaHeight: 80
  },
  {
    id: 'npc_it_marcos',
    name: 'Marcos',
    role: 'Dev Full Stack',
    group: 'team',
    textureKey: 'npc_it_bruno',
    assetFile: 'ti_room_npcs/bruno_sit.png',
    sitDirectionFlipX: false,
    scaleMultiplier: 2,
    x: 98,
    y: 252,
    areaWidth: 60,
    areaHeight: 120
  },
  {
    id: 'npc_it_carlos',
    name: 'Carlos',
    role: 'QA Engineer',
    group: 'team',
    textureKey: 'npc_it_carla',
    assetFile: 'ti_room_npcs/carla_sit.png',
    sitDirectionFlipX: true,
    scaleMultiplier: 2,
    x: 428,
    y: 78,
    areaWidth: 52,
    areaHeight: 120
  },
  {
    id: 'npc_it_diego',
    name: 'Diego',
    role: 'DevOps',
    group: 'team',
    textureKey: 'npc_it_diego',
    assetFile: 'ti_room_npcs/diego_sit.png',
    sitDirectionFlipX: true,
    scaleMultiplier: 2,
    x: 428,
    y: 302,
    areaWidth: 52,
    areaHeight: 80
  },
  {
    id: 'npc_it_bruno',
    name: 'Bruno',
    role: 'Gerente de TI',
    group: 'manager',
    textureKey: 'npc_it_renata',
    assetFile: 'ti_room_npcs/renata_sit.png',
    sitDirectionFlipX: true,
    scaleMultiplier: 2,
    x: 428,
    y: 412,
    areaWidth: 52,
    areaHeight: 80
  }
];

const IT_ROOM_TEAM = IT_ROOM_NPCS_LIST.filter((npc) => npc.group === 'team');
const IT_ROOM_MANAGER = IT_ROOM_NPCS_LIST.find((npc) => npc.group === 'manager') || null;

export const IT_ROOM_NPCS_CONFIG = {
  list: IT_ROOM_NPCS_LIST,
  team: IT_ROOM_TEAM,
  manager: IT_ROOM_MANAGER
};
