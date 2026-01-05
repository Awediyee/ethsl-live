import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function LoginBackground() {
    const containerRef = useRef()

    useEffect(() => {
        if (!containerRef.current) return

        // Scene Setup
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)

        const updateColors = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
            const base = isDark ? '#64b5f6' : '#1976d2'
            const color1 = new THREE.Color(base)
            const color2 = new THREE.Color(isDark ? '#ffffff' : '#bbdefb')

            const colorAttr = geometry.getAttribute('color')
            for (let i = 0; i < particlesCount; i++) {
                const mixedColor = color1.clone().lerp(color2, Math.random())
                colorAttr.setXYZ(i, mixedColor.r, mixedColor.g, mixedColor.b)
            }
            colorAttr.needsUpdate = true
        }

        // Particles
        const particlesCount = 2500
        const positions = new Float32Array(particlesCount * 3)
        const colors = new Float32Array(particlesCount * 3)
        const sizes = new Float32Array(particlesCount)

        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'
        const baseColor = isDarkMode ? '#64b5f6' : '#1976d2'
        const color1 = new THREE.Color(baseColor)
        const color2 = new THREE.Color(isDarkMode ? '#ffffff' : '#bbdefb')

        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15

            const mixedColor = color1.clone().lerp(color2, Math.random())
            colors[i * 3] = mixedColor.r
            colors[i * 3 + 1] = mixedColor.g
            colors[i * 3 + 2] = mixedColor.b

            sizes[i] = Math.random() * 0.5 + 0.5
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const material = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        })

        const points = new THREE.Points(geometry, material)
        scene.add(points)

        camera.position.z = 4

        // Mouse movement influence
        let mouseX = 0
        let mouseY = 0
        const handleMouseMove = (event) => {
            mouseX = (event.clientX / window.innerWidth - 0.5) * 0.5
            mouseY = (event.clientY / window.innerHeight - 0.5) * 0.5
        }
        window.addEventListener('mousemove', handleMouseMove)

        // Animation
        let clock = new THREE.Clock()
        let frameId

        const animate = () => {
            frameId = requestAnimationFrame(animate)
            const elapsedTime = clock.getElapsedTime()

            points.rotation.y = elapsedTime * 0.03
            points.rotation.x = elapsedTime * 0.01

            // Subtle sway based on mouse
            camera.position.x += (mouseX - camera.position.x) * 0.05
            camera.position.y += (-mouseY - camera.position.y) * 0.05
            camera.lookAt(scene.position)

            renderer.render(scene, camera)
        }

        animate()

        // Resize Handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }

        window.addEventListener('resize', handleResize)

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    updateColors()
                }
            })
        })
        observer.observe(document.documentElement, { attributes: true })

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            observer.disconnect()
            cancelAnimationFrame(frameId)

            if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
                containerRef.current.removeChild(renderer.domElement)
            }

            geometry.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0, // Set to 0, content will be 10
                pointerEvents: 'none',
                background: 'transparent'
            }}
        />
    )
}

export default LoginBackground
