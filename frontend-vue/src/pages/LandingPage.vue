<!-- Página institucional do CTI Nexus. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen relative isolate overflow-x-hidden">

    <!-- Efeitos de fundo: brilho azul no topo e rede neural (pontos ligados por linhas). -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-blue-primary/15 via-blue-primary/5 to-transparent blur-3xl pointer-events-none -z-10" aria-hidden="true"></div>
    <div
      class="absolute inset-x-0 top-55 h-300 -z-10 overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,transparent_0%,#000_25%,#000_70%,transparent_100%)]"
      aria-hidden="true"
    >
      <NeuralBackground />
    </div>

    <LandingHeader />

    <main>
      <HeroSection />
      <ImpactSection />
      <FeaturesSection />
      <JourneySection />
      <CtaSection />
    </main>

    <LandingFooter />
  </div>
</template>

<script setup>
import NeuralBackground from '../components/ui/NeuralBackground.vue'
import LandingHeader from '../components/landing/LandingHeader.vue'
import HeroSection from '../components/landing/HeroSection.vue'
import ImpactSection from '../components/landing/ImpactSection.vue'
import FeaturesSection from '../components/landing/FeaturesSection.vue'
import JourneySection from '../components/landing/JourneySection.vue'
import CtaSection from '../components/landing/CtaSection.vue'
import LandingFooter from '../components/landing/LandingFooter.vue'
</script>
