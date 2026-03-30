# Assets Organization (Runtime-First)

Este diretorio agora separa o que e runtime do que e legado/editor:

- Runtime ativo:
  - mapas `.json` em `maps/` (ex.: `maps/reception.json`, `maps/coffee-room.json`, `maps/it-room.json`)
  - tilesets de mapa em `tilesets/`
  - sprites realmente usados no jogo
  - subpastas de personagens (`player/`, `baker/`, `boss/`, `gardner/`, `reader/`, `ti_room_npcs/`)

- Legado sem vinculo runtime:
  - `_legacy-unused/` contem arquivos sem referencia ativa no codigo/mapas atuais (incluindo `leo.png` e `leo_atlas.json`)

- Fontes de edicao (Tiled):
  - `_editor-source/` contem `.tmx/.tmj/.tsx/.tsj` e tileset source usados apenas em edicao

Observacao tecnica:

- `src/utils/AssetResolver.js` ignora `_legacy-unused` e `_editor-source` no glob de runtime,
  evitando empacotar arquivos sem uso no build.

- `src/utils/AssetResolver.js` resolve mapas a partir de `assets/maps/*.json`.
