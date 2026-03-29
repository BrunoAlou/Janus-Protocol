# Player Refactoring - Leo 2 Implementation

## Overview
Refactored player system to use leo_2 spritesheets with new animations and proper walk→idle transitions.

## Changes Made

### 1. Dynamic Asset Loading
**File:** `src/player/loadPlayerAssets.js`
- Updated to load all 8 leo_2 spritesheets as separate textures:
  - `leo_walk` (768x64, 24 frames - 6 per direction)
  - `leo_idle` (768x64, 24 frames - 6 per direction)
  - `leo_lift` (1792x64, 56 frames - 14 per direction)
  - `leo_phone` (384x64, 12 frames - 3 per direction)
  - `leo_pickup` (1536x64, 48 frames - 12 per direction)
  - `leo_read` (384x64, 12 frames - 3 per direction)
  - `leo_sit` (384x64, 12 frames - 3 per direction)
  - `leo_throw` (1792x64, 56 frames - 14 per direction)

- Frame size: 32x64 (down from 64x64)
- Each action is loaded as a separate texture for modularity

### 2. Comprehensive Animation System
**File:** `src/player/playerAnimations.js` - Complete rewrite
- **Walk Animations**: 6 frames per direction, repeat: 0 (one-shot)
  - Transition to idle_[direction] on completion
  
- **Idle Animations**: 6 frames per direction, repeat: -1 (looping)
  - Directional variations: idle_right, idle_up, idle_left, idle_down
  
- **New Action Animations** (directional):
  - **Lift** (14 frames): Heavy lifting animation
  - **Phone** (3 frames): Talking on phone
  - **Pickup** (12 frames): Picking up small items
  - **Read** (3 frames): Reading documents
  - **Sit** (3 frames): Sitting down
  - **Throw** (14 frames): Throwing objects

- **Helper Functions**:
  - `resolvePlayerAnimation(action, direction)` - Get animation key
  - `getIdleAnimation(direction)` - Get idle animation for direction
  - Automatic walk→idle transitions via `animationcomplete` event

### 3. Updated Player Factory
**File:** `src/player/PlayerFactory.js`
- Changed default initial frame to `idle_down_01` from leo_idle texture
- Hitbox config updated for 32x64 frames:
  - Circle radius: 6 (down from 8)
  - Improved collision detection for new sprite size
  
- **Animation Lifecycle**:
  - Starts with `idle_down` animation
  - Listens to `animationcomplete` event on walk animations
  - Automatically transitions to matching idle animation
  - Example: `walk_right` completion → `idle_right` plays

```javascript
// Auto-transition walk → idle
sprite.on('animationcomplete', (anim) => {
  if (anim.key.startsWith('walk_')) {
    const direction = anim.key.replace('walk_', '');
    const idleKey = getIdleAnimation(direction);
    if (idleKey && sprite.anims.exists(idleKey)) {
      sprite.play(idleKey);
    }
  }
});
```

### 4. Atlas Generation Script
**File:** `scripts/generate-player-atlas.js` (new)
- Automatically generates JSON atlas files for all leo_2 spritesheets
- Calculates frame positions based on sprite dimensions
- Creates directional frame names: `{action}_{direction}_{frameNum}`

### 5. Frame Inspector Updates
- Updated debug tools to use leo_idle texture
- Frame preview and grid inspection still functional

## Integration Points

### PlayerController (unchanged)
- Still uses `resolvePlayerAnimation` as adapter
- Automatically resolves to new animation keys
- No changes needed - works seamlessly with new system

### CharacterCommandController (unchanged)
- Commands like `{ action: 'walk', velocity: {...} }` work as before
- Direction inference handles all 4 directions
- Adapter pattern means controller is action/direction agnostic

### Scene Integration
No changes needed to scenes - they already call:
```javascript
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
loadPlayerAssets(scene); // Loads all leo_2 textures
```

## Animation Behavior

### Walk → Idle Transitions (Key Feature)
```
walk_right (6 frames @ 12fps) → idle_right (6 frames @ 8fps looping)
walk_up    (6 frames @ 12fps) → idle_up    (6 frames @ 8fps looping)
walk_left  (6 frames @ 12fps) → idle_left  (6 frames @ 8fps looping)
walk_down  (6 frames @ 12fps) → idle_down  (6 frames @ 8fps looping)
```

### Action Animations (Non-looping)
- `lift_*`, `pickup_*`, `throw_*` play once (12 fps)
- `phone_*`, `read_*`, `sit_*` loop (8 fps)

## Asset Files Generated

### Spritesheet PNG Files (existing)
```
src/assets/leo_2_walk.png      (768x64)
src/assets/leo_2_idle.png      (768x64)
src/assets/leo_2_lift.png      (1792x64)
src/assets/leo_2_phone.png     (384x64)
src/assets/leo_2_pickup.png    (1536x64)
src/assets/leo_2_read.png      (384x64)
src/assets/leo_2_sit.png       (384x64)
src/assets/leo_2_throw.png     (1792x64)
```

### Atlas JSON Files (generated)
```
src/assets/leo_2_walk_atlas.json    (24 frames)
src/assets/leo_2_idle_atlas.json    (24 frames)
src/assets/leo_2_lift_atlas.json    (56 frames)
src/assets/leo_2_phone_atlas.json   (12 frames)
src/assets/leo_2_pickup_atlas.json  (48 frames)
src/assets/leo_2_read_atlas.json    (12 frames)
src/assets/leo_2_sit_atlas.json     (12 frames)
src/assets/leo_2_throw_atlas.json   (56 frames)
```

## Build Status
✓ 198 modules transformed
✓ All leo_2 assets included in build
✓ No compilation errors
✓ Ready for game testing

## Future Enhancements
1. Integrate action animations into interaction system
2. Add transition animations between actions
3. Implement diagonal walking if needed
4. Add status effect overlays (stunned, confused, etc.)

## Testing Checklist
- [ ] Player spawns with idle_down animation
- [ ] Movement triggers walk_[direction]
- [ ] Walk animation completes and transitions to idle_[direction]
- [ ] All 4 directions (up, down, left, right) work correctly
- [ ] Frame inspector still functions (G key for frame grid)
- [ ] Action commands via CharacterCommandController resolve properly
