import { useEffect, useRef } from 'react';

function IceScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    import('three').then((THREE) => {
      if (cancelled || !mountRef.current) return;

      const mount = mountRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
      camera.position.set(0, 0.9, 5.8);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xe6fbff, 1.55));

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
      keyLight.position.set(3.5, 5, 4);
      scene.add(keyLight);

      const cyanLight = new THREE.PointLight(0x54e3ff, 9, 16);
      cyanLight.position.set(-3.8, 1.5, 2.5);
      scene.add(cyanLight);

      const rimLight = new THREE.PointLight(0xffffff, 5, 12);
      rimLight.position.set(2.8, 2.2, -1.6);
      scene.add(rimLight);

      const iceMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xd9fbff,
        transmission: 0.18,
        transparent: true,
        opacity: 0.9,
        roughness: 0.22,
        metalness: 0,
        thickness: 0.9,
        ior: 1.31,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        emissive: 0x0b6f8d,
        emissiveIntensity: 0.18,
        flatShading: true,
      });

      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.72,
        roughness: 0.1,
      });

      const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x6bdcf2,
        transparent: true,
        opacity: 0.38,
        roughness: 0.34,
        emissive: 0x1ab8d8,
        emissiveIntensity: 0.26,
        flatShading: true,
      });

      const group = new THREE.Group();
      const shapes = [
        { geo: new THREE.DodecahedronGeometry(1.15, 0), pos: [-1.45, 0.1, 0], rot: [0.4, 0.2, -0.2], scale: [1.25, 0.86, 0.9] },
        { geo: new THREE.IcosahedronGeometry(1.05, 1), pos: [0.42, 0.48, 0.26], rot: [0.15, -0.2, 0.18], scale: [1.1, 0.9, 0.84] },
        { geo: new THREE.DodecahedronGeometry(0.78, 0), pos: [1.72, -0.02, -0.12], rot: [-0.2, 0.5, 0.32], scale: [1, 0.78, 0.96] },
      ];

      shapes.forEach((shape) => {
        const mesh = new THREE.Mesh(shape.geo, iceMaterial);
        mesh.position.set(...shape.pos);
        mesh.rotation.set(...shape.rot);
        mesh.scale.set(...shape.scale);
        group.add(mesh);

        const core = new THREE.Mesh(shape.geo, coreMaterial);
        core.position.copy(mesh.position);
        core.rotation.copy(mesh.rotation);
        core.scale.set(shape.scale[0] * 0.72, shape.scale[1] * 0.7, shape.scale[2] * 0.72);
        group.add(core);

        const wire = new THREE.LineSegments(new THREE.EdgesGeometry(shape.geo), edgeMaterial);
        wire.position.copy(mesh.position);
        wire.rotation.copy(mesh.rotation);
        wire.scale.copy(mesh.scale);
        group.add(wire);
      });

      group.scale.set(1.22, 1.22, 1.22);
      scene.add(group);

      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = 86;
      const positions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        positions[index * 3] = (Math.random() - 0.5) * 8;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 4.8;
        positions[index * 3 + 2] = (Math.random() - 0.5) * 3.8;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.035,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        }),
      );
      scene.add(particles);

      let frameId = 0;
      const startedAt = performance.now();

      const render = () => {
        const elapsed = (performance.now() - startedAt) / 1000;
        group.rotation.y = elapsed * 0.18;
        group.rotation.x = Math.sin(elapsed * 0.7) * 0.06;
        group.position.y = Math.sin(elapsed * 0.9) * 0.08;
        particles.rotation.y = elapsed * 0.035;
        particles.position.y = Math.sin(elapsed * 0.45) * 0.08;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(render);
      };

      render();

      const resize = () => {
        if (!mount.clientWidth || !mount.clientHeight) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener('resize', resize);

      cleanup = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resize);
        mount.removeChild(renderer.domElement);
        shapes.forEach((shape) => shape.geo.dispose());
        iceMaterial.dispose();
        edgeMaterial.dispose();
        coreMaterial.dispose();
        particleGeometry.dispose();
        particles.material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div className="ice-scene" ref={mountRef} aria-hidden="true" />;
}

export default IceScene;
