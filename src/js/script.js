import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 20); // Adjusted for better visibility

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
camera.add(pointLight);
scene.add(camera);

// Sphere materials setup
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff, // white color
  emissive: 0xffffff, // emissive color the same as white to simulate brightness
  emissiveIntensity: 0.1, // intensity of the emissive color
  metalness: 0.3,
  roughness: 0.4,
  wireframe: true
});

// Inner Sphere setup
const innerSphereGeometry = new THREE.SphereGeometry(3, 20, 20);
const innerSphere = new THREE.Mesh(innerSphereGeometry, sphereMaterial);
scene.add(innerSphere);

// Outer Sphere setup
const outerSphereGeometry = new THREE.SphereGeometry(8, 64, 64);
const outerSphere = new THREE.Mesh(outerSphereGeometry, sphereMaterial);
scene.add(outerSphere);



// Vertex Shader
const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
    gl_PointSize = 40.0; // Adjust point size here
  }
`;

// Fragment Shader
const fragmentShader = `
  varying vec3 vPosition;
  void main() {
    float distance = length(gl_PointCoord - vec2(0.5));
    float intensity = smoothstep(0.1, 0.0, distance);
    gl_FragColor = vec4(1.0, 1.0, 1.0, intensity); // White color with alpha based on distance from center
  }
`;

// Function to add stars with hovering effect
// Function to add stars with hovering effect
function addStars(numberOfStars) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });
  
    const vertices = [];
    const hoverDirections = []; // Store direction for each star to hover
  
    for (let i = 0; i < numberOfStars; i++) {
      // Use spherical coordinates to ensure stars are placed in a spherical shell
      const radius = 9 + Math.random() * 2; // Radius between 9 and 11
      const theta = Math.random() * Math.PI * 2; // Angle between 0 and 2*PI radians
      const phi = Math.acos((Math.random() * 2) - 1); // Angle between 0 and PI radians
  
      // Convert spherical coordinates to Cartesian coordinates for XYZ
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
  
      vertices.push(x, y, z);
  
      // Random small direction for hovering effect (as a flat array)
      hoverDirections.push((Math.random() - 0.5) * 0.005);
      hoverDirections.push((Math.random() - 0.5) * 0.005);
      hoverDirections.push((Math.random() - 0.5) * 0.005);
    }
  
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    starsGeometry.setAttribute('hoverDirection', new THREE.Float32BufferAttribute(hoverDirections, 3));
  
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
  
    // Function to update stars position to create hovering effect
    stars.update = () => {
        const positions = stars.geometry.attributes.position.array;
        const hoverDirectionsArray = stars.geometry.attributes.hoverDirection.array;
      
        for (let i = 0; i < positions.length; i += 3) {
          // Apply small hover effect
          positions[i] += hoverDirectionsArray[i];
          positions[i + 1] += hoverDirectionsArray[i + 1];
          positions[i + 2] += hoverDirectionsArray[i + 2];
      
          // Calculate the distance from the center after moving
          let distance = Math.sqrt(
            positions[i] * positions[i] +
            positions[i + 1] * positions[i + 1] +
            positions[i + 2] * positions[i + 2]
          );
      
          // If the star has moved inside the sphere or beyond the outer limit,
          // reverse the hover direction and bring it back within the band
          if (distance < 9 || distance > 11) {
            hoverDirectionsArray[i] *= -1;
            hoverDirectionsArray[i + 1] *= -1;
            hoverDirectionsArray[i + 2] *= -1;
      
            // Apply the reversed direction immediately to correct the position
            positions[i] += 2 * hoverDirectionsArray[i];
            positions[i + 1] += 2 * hoverDirectionsArray[i + 1];
            positions[i + 2] += 2 * hoverDirectionsArray[i + 2];
          }
      
          // Randomly change direction occasionally for more organic motion
          if (Math.random() > 0.99) {
            hoverDirectionsArray[i] *= -1;
            hoverDirectionsArray[i + 1] *= -1;
            hoverDirectionsArray[i + 2] *= -1;
          }
        }
  
      stars.geometry.attributes.position.needsUpdate = true; // Required after changing positions
    };
  
    return stars; // Return the stars object with its update function
  }
    
  // Create stars and store reference to them
  const stars = addStars(50);
  
  // Resize function
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

  // Inside the animation loop, add this to update the stars:
  const animate = function () {
    requestAnimationFrame(animate);
    
    // Update stars for hovering effect
    stars.update();
    
    controls.update();
    renderer.render(scene, camera);
  };
  
  animate();
  