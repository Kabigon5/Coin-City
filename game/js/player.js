// Third-person player controller and camera. Camera-relative WASD movement
// with acceleration, per-axis collide-and-slide against zone colliders, a
// smooth orbit camera that raycasts against solids so it never sits inside
// walls, surface-aware footsteps, and a bicycle mode for faster travel.
CC.player = (function () {
  var rig = null, group = null, bikeMesh = null;
  var pos = new THREE.Vector3(8, 0, 6);
  var faceYaw = Math.PI, vel = 0, camera = null;
  var camYaw = Math.PI * 0.85, camPitch = 0.42, camDist = 5;
  var camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  var stepTimer = 0, riding = false;
  var ray = new THREE.Raycaster();
  var R = 0.45; // body radius

  function spawn(scene, cam, look) {
    camera = cam;
    if (group) scene.remove(group);
    rig = CC.chars.make(look);
    group = rig.group;
    group.position.copy(pos);
    group.rotation.y = faceYaw;
    scene.add(group);
    // simple bicycle shown while riding
    bikeMesh = new THREE.Group();
    var bm = new THREE.MeshLambertMaterial({ color: 0xb0342c });
    [[0, -0.62], [0, 0.62]].forEach(function (wp) {
      var wh = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 16), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
      wh.rotation.y = Math.PI / 2; wh.position.set(0, 0.34, wp[1]); bikeMesh.add(wh);
    });
    var bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.1), bm);
    bar.position.y = 0.55; bikeMesh.add(bar);
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), bm);
    hb.position.set(0, 0.85, 0.5); bikeMesh.add(hb);
    var basket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.26), new THREE.MeshLambertMaterial({ color: 0x8a6642 }));
    basket.position.set(0, 0.75, 0.72); bikeMesh.add(basket);
    bikeMesh.visible = false;
    group.add(bikeMesh);
    snapCamera();
  }

  function setRiding(on) {
    riding = on && CC.state.bike.owned;
    CC.state.bike.riding = riding;
    if (bikeMesh) bikeMesh.visible = riding;
    if (riding) CC.audio.sfx("bike");
  }

  // circle vs AABB block test on one axis at a time gives wall sliding
  function blocked(nx, nz) {
    var list = CC.world.colliders[CC.zone] || [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (nx + R > b.x1 && nx - R < b.x2 && nz + R > b.z1 && nz - R < b.z2) return true;
    }
    return false;
  }

  function inPark(x, z) { return x > -128 && x < -74 && z > -48 && z < -10; }

  function snapCamera() {
    camTgt.set(pos.x, 1.55, pos.z);
    var cp = Math.cos(camPitch), sp = Math.sin(camPitch);
    camPos.set(camTgt.x + Math.sin(camYaw) * cp * camDist,
      camTgt.y + sp * camDist,
      camTgt.z + Math.cos(camYaw) * cp * camDist);
    if (camera) { camera.position.copy(camPos); camera.lookAt(camTgt); }
  }

  function update(dt) {
    if (!group || !camera) return;

    // camera input
    if (!CC.paused) {
      var m = CC.input.mouse();
      var sens = 0.0024 * CC.settings.camSens;
      camYaw -= m.dx * sens;
      var py = m.dy * sens * (CC.settings.invertY ? -1 : 1);
      camPitch = CC.clamp(camPitch + py, -0.1, 1.15);
      camDist = CC.clamp(camDist + m.wheel * 0.004, 2.5, 7.5);
      var lp = CC.input.lookPad();
      camYaw -= lp.x * dt * 2.6 * CC.settings.camSens;
      camPitch = CC.clamp(camPitch + lp.y * dt * 2 * (CC.settings.invertY ? -1 : 1), -0.1, 1.15);
    }

    // movement input, camera relative
    var ax = 0, az = 0;
    if (!CC.paused) { var a = CC.input.axis(); ax = a.x; az = a.z; }
    var fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);   // forward, away from camera
    var rx = Math.cos(camYaw), rz = -Math.sin(camYaw);    // right
    var dx = fx * (-az) + rx * ax, dz = fz * (-az) + rz * ax;
    var moving = Math.abs(dx) + Math.abs(dz) > 0.01;

    var top = riding ? 8.5 : (CC.input.running() ? 6 : 3.2);
    // low energy slows the player a little, never stops them
    if (CC.state.energy < 15) top *= 0.72;
    var target = moving ? top : 0;
    vel = CC.lerp(vel, target, Math.min(1, dt * (moving ? 8 : 11)));

    if (vel > 0.05 && moving) {
      var len = Math.sqrt(dx * dx + dz * dz); dx /= len; dz /= len;
      var nx = pos.x + dx * vel * dt, nz = pos.z + dz * vel * dt;
      if (!blocked(nx, pos.z)) pos.x = nx;
      if (!blocked(pos.x, nz)) pos.z = nz;
      faceYaw = Math.atan2(dx, dz);
      // footsteps
      stepTimer -= dt;
      if (stepTimer <= 0 && CC.input.isLocked()) {
        stepTimer = riding ? 0.5 : (0.55 - (vel / top) * 0.22);
        if (riding) { if (Math.random() < 0.2) CC.audio.sfx("bike"); }
        else CC.audio.sfx(inPark(pos.x, pos.z) ? "stepGrass" : "step");
      }
    }

    group.position.x = pos.x; group.position.z = pos.z;
    var cy = group.rotation.y;
    var diff = ((faceYaw - cy + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    group.rotation.y = cy + diff * Math.min(1, dt * 10);
    var moveAmt = vel / 6;
    if (riding) {
      // legs tucked, body steady while riding
      rig.legL.rotation.x = -0.9; rig.legR.rotation.x = -0.9;
      rig.armL.rotation.x = -0.5; rig.armR.rotation.x = -0.5;
      group.position.y = 0.18;
    } else {
      CC.chars.animate(rig, CC.clamp(moveAmt, 0, 1), dt);
    }

    // camera follow with occlusion
    camTgt.set(pos.x, 1.55, pos.z);
    var cp = Math.cos(camPitch), sp = Math.sin(camPitch);
    var want = new THREE.Vector3(
      camTgt.x + Math.sin(camYaw) * cp * camDist,
      camTgt.y + sp * camDist,
      camTgt.z + Math.cos(camYaw) * cp * camDist);
    var dir = want.clone().sub(camTgt), dLen = dir.length(); dir.normalize();
    ray.set(camTgt, dir); ray.far = dLen;
    var hits = ray.intersectObjects(CC.world.solids, false);
    if (hits.length > 0 && hits[0].distance < dLen) {
      want.copy(camTgt).addScaledVector(dir, Math.max(0.7, hits[0].distance * 0.88));
    }
    if (want.y < 0.4) want.y = 0.4;
    var k = 1 - Math.exp(-dt * 9);
    camPos.lerp(want, k);
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
  }

  function warp(x, z, yaw) {
    pos.set(x, 0, z);
    if (yaw !== undefined) { faceYaw = yaw; camYaw = yaw + Math.PI; }
    if (group) { group.position.copy(pos); group.rotation.y = faceYaw; }
    snapCamera();
  }

  return {
    spawn: spawn, update: update, warp: warp, setRiding: setRiding,
    pos: pos,
    riding: function () { return riding; },
    facing: function () { return faceYaw; },
    getRig: function () { return rig; },
    camYawRef: function () { return camYaw; },
    setCamYaw: function (v) { camYaw = v; snapCamera(); }
  };
})();
