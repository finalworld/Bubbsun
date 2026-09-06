# Yatsun dice physics

The old render loop advanced Cannon once per display frame but stopped it using
wall-clock deadlines (2.45 / 3.2 seconds). A separate 120 ms pass then moved dice
to a screen-space layout and rotated them toward a result. Held collision bodies
were created without their visible orientation. Every render rebuilt five WebGL
contexts/materials, and independent canvases had no shared depth buffer. These
paths caused late movement, false stacking, mismatched contacts and flashes.

## Current implementation

- `dice-physics.mjs`: Rapier 3D 0.19.3, solid rounded cubes, one edge = one unit,
  mass 1, outer half extent 0.5 and corner radius 0.065. The collider encloses the
  supplied glTF model, including its rounded edges. The engine derives local
  inertia from the collider, independent of launch orientation.
- Fixed 120 Hz recorded poses, at least two integration steps per recorded frame.
  Faster translation or rotation subdivides integration to limit corner travel
  to 0.015 edge lengths per step. Nonlinear CCD is also enabled, with four CCD
  substeps and soft prediction distance 0.15.
- Gravity 22; linear/angular damping 0.25/0.30; die friction/restitution
  0.16/0.38; felt friction/restitution 0.44/0.24. Material combine rules select
  the felt's friction and bounce on the floor. Rapier uses Coulomb contact
  friction rather than the old engine's gravity-derived tangent impulse cap.
- Twelve solver iterations and two internal PGS iterations; allowed linear
  error 0.00015. Automatic sleeping is disabled while calculating a throw:
  low speed alone cannot freeze a die on an edge.
- Completion requires every active die to have floor contacts, centre height
  within 0.012 of 0.5, face tilt below 2.5 degrees, linear speed below 0.035,
  angular speed below 0.07, and penetration below 0.006 for 0.45 continuous
  seconds. Scoring and AI decisions remain disabled until playback reaches that
  verified final frame.
- A stationary invalid die receives a physical impulse before completion. A die
  wedged among held dice is physically rethrown toward free space with enough
  lift to clear them. No position/quaternion is assigned during recovery.
  A 30-second safety bound triggers a physical recovery in the same trajectory,
  without changing poses. After two extra recovery windows an unresolved throw
  reports failure; it cannot manufacture a result.
- `dice-worker.mjs` calculates the actual dynamics off the UI thread. The
  renderer plays those poses at their recorded times, interpolating between
  adjacent samples. Hidden tabs pause the display clock. No extra settling
  animation, layout planner, result snap or AI-only scattering remains.
- `dice-view.mjs` keeps one shared scene and one renderer. Models, textures,
  materials and held poses persist across throws and turn changes. Hold controls
  only change a ring/badge, never geometry or pose. A viewport resize changes the
  camera, never world positions.
- Solo/AI results are read from the actual upward local face. Multiplayer keeps
  server-authoritative results: a symmetry of the rounded cube rotates the
  *entire* precomputed orientation sequence before the first frame is shown.
  Symmetric collision geometry and inertia are unchanged, with no end-of-roll
  correction. No server scoring or randomness rules were changed.

## Verification

Run `node --test tests/yatsun-*.test.mjs`. The physics suite contains 546 counted
throw scenarios plus setup throws and sampling/restoration checks: 300 ordinary
casts across three board configurations, 200 held-die rerolls, 30 multiplayer
traces, edge/corner balances, piles/deep overlaps, a die on a held die, and
head-on collisions at speeds 10, 45 and 100. It checks final collider separation,
continuous stability, glTF/collider fit, exact held poses on every frame,
15/30/60/144 Hz playback, and absence of post-completion drift.

`tests/yatsun-physics-browser.html` is a local-only browser harness. It loads the
actual app, model, materials, renderer and worker; only authentication/network
and AI thinking delays are stubbed. Its buttons exercise 18 player/AI casts and
three multiplayer casts while checking object identity, held poses, scoring
order and motion after completion. `?skin=cherry` / `?skin=pearl` select reference
skins. Neither fixture nor tests are uploaded by the Yatsun publishing workflow.

The workflow uploads the pinned engine and all new modules before publishing the
new app/HTML entry point. Its existing PHP room tests also run before upload.
