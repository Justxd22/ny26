"use client";

import React, { forwardRef, useMemo } from "react";
import { Uniform } from "three";
import { Effect } from "postprocessing";

// The GLSL Shader - This is the GPU version of your logic
// We use the same math: pow(distance, intensity)
const fragmentShader = `
  uniform float intensity;
  uniform float radius;
  uniform vec2 center;
  uniform float width;
  uniform float height;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float aspect = width / height;
    vec2 uvCorrected = uv;
    uvCorrected.x *= aspect;
    vec2 centerCorrected = center;
    centerCorrected.x *= aspect;

    vec2 dir = uvCorrected - centerCorrected;
    float dist = length(dir);

    if (dist < radius) {
        float normalizedDist = dist / radius;
        
        // --- THE FIX IS HERE ---
        // PREVIOUSLY: pow(normalizedDist, 1.0 / intensity) -> SUCKED IN (Blackhole)
        // NOW: pow(normalizedDist, intensity) -> BULGES OUT (Fisheye)
        float distortedDist = pow(normalizedDist, intensity) * radius;
        
        vec2 sampleOffset = normalize(dir) * distortedDist;
        vec2 sampleUV = centerCorrected + sampleOffset;
        sampleUV.x /= aspect;

        // Check if sampling goes out of bounds (avoids ugly streaks)
        if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
            outputColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            outputColor = texture2D(inputBuffer, sampleUV);
        }
    } else {
        outputColor = inputColor;
    }
  }
`;

class LensEffectImpl extends Effect {
  constructor({ intensity = 1.0, radius = 0.4 }) {
    super("LensEffect", fragmentShader, {
      uniforms: new Map([
        ["intensity", new Uniform(intensity)],
        ["radius", new Uniform(radius)],
        ["center", new Uniform([0.5, 0.5])], // Center of screen
        ["width", new Uniform(window.innerWidth)],
        ["height", new Uniform(window.innerHeight)],
      ]),
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get("width").value = renderer.domElement.width;
    this.uniforms.get("height").value = renderer.domElement.height;
  }
}

// Wrap it for React
export const Lens = forwardRef(({ intensity = 2.0, radius = 0.5 }, ref) => {
  const effect = useMemo(() => new LensEffectImpl({ intensity, radius }), [intensity, radius]);
  return <primitive ref={ref} object={effect} dispose={null} />;
});