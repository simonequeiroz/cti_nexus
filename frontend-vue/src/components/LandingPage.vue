<template>
  <div class="bg-[#F8FAFC] text-black-dark font-sans antialiased min-h-screen relative overflow-x-hidden">

    <!-- LUZ DE GLOW (Efeito de iluminação no fundo) -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-blue-primary/15 via-blue-primary/5 to-transparent blur-3xl pointer-events-none -z-10"></div>

    <!-- MALHA DE FUNDO (Grid / Blueprint) -->
    <div
      class="absolute inset-0 -z-10 overflow-hidden pointer-events-none h-[1100px]"
      style="mask-image: radial-gradient(ellipse 85% 65% at 50% 0%, #000 65%, transparent 100%); -webkit-mask-image: radial-gradient(ellipse 85% 65% at 50% 0%, #000 65%, transparent 100%);"
    >
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#006EB7" stroke-width="1.2" stroke-opacity="0.18" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>

    <!-- HEADER E NAVEGAÇÃO -->
    <header>
      <nav class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div class="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-black-dark">
          <span class="w-2.5 h-2.5 bg-blue-primary rounded-full inline-block shadow-[0_0_10px_#006EB7]"></span>
          CTI <span class="text-blue-primary">Nexus</span>
        </div>
        <div class="hidden md:flex gap-8 text-sm font-medium text-regular">
          <a href="#sobre" class="hover:text-blue-primary transition-colors">Sobre</a>
          <a href="#recursos" class="hover:text-blue-primary transition-colors">Recursos</a>
          <a href="#jornada" class="hover:text-blue-primary transition-colors">Jornada</a>
        </div>
        <a href="#" class="bg-blue-primary hover:bg-blue-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all">Entrar no sistema</a>
      </nav>
    </header>

    <!-- CONTEÚDO PRINCIPAL -->
    <main>

      <!-- HERO SECTION -->
      <section id="hero" class="pt-8 pb-12">
        <div class="max-w-7xl mx-auto px-6">
          
          <!-- EYEBROW -->
          <div class="text-xs font-bold tracking-widest uppercase text-blue-primary mb-4 flex items-center gap-2">
            <span class="w-2 h-2 bg-orange rounded-full"></span>
            Tratamento e análise de dados comerciais
          </div>

          <!-- TÍTULO PRINCIPAL -->
          <h1 class="font-display font-bold text-4xl md:text-6xl leading-[1.1] tracking-tight max-w-3xl text-black-dark">
            Do <span class="text-black-light line-through decoration-orange decoration-4">Excel bagunçado</span> à decisão certa.
          </h1>

          <!-- SUBTÍTULO -->
          <p class="mt-5 text-base md:text-lg text-regular max-w-xl leading-relaxed">
            Organize a carteira de clientes, padronize os dados e transforme planilhas manuais em insights estratégicos — sem digitação duplicada, sem "IND." e "Industria" convivendo na mesma coluna.
          </p>

          <!-- CTAS -->
          <div class="flex gap-4 mt-8 flex-wrap">
            <a href="#" class="bg-blue-primary hover:bg-blue-primary-hover text-white px-7 py-3.5 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              Acessar sistema →
            </a>
            <a href="#recursos" class="bg-white/85 backdrop-blur-sm hover:border-blue-primary text-black-dark border border-blue-secondary px-6 py-3.5 rounded-lg font-semibold text-sm shadow-sm hover:text-blue-primary hover:-translate-y-0.5 transition-all">
              Ver como funciona
            </a>
          </div>

          <!-- PAINEL DE TRANSFORMAÇÃO -->
          <div class="mt-14 border border-blue-secondary/80 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_60px_1fr] bg-white/90 backdrop-blur-md shadow-2xl">
            
            <!-- PLANILHA COMO CHEGA -->
            <div class="p-8 bg-[#FAFCFE]/60">
              <div class="text-[11px] font-mono tracking-wider uppercase text-regular mb-4 font-semibold">PLANILHA — COMO CHEGA</div>
              
              <div class="border border-blue-secondary rounded-lg font-mono text-xs overflow-hidden bg-white shadow-sm">
                <div class="grid grid-cols-[70px_1fr_90px] border-b border-blue-secondary bg-blue-secondary/40 font-bold text-black-dark">
                  <div class="p-2.5 border-r border-blue-secondary">CÓD.</div>
                  <div class="p-2.5 border-r border-blue-secondary">SEGMENTO</div>
                  <div class="p-2.5">NÍVEL</div>
                </div>
                <div class="grid grid-cols-[70px_1fr_90px] border-b border-blue-secondary">
                  <div class="p-2.5 border-r border-blue-secondary">0412</div>
                  <div class="p-2.5 border-r border-blue-secondary text-orange font-bold bg-orange/10">IND.</div>
                  <div class="p-2.5">A</div>
                </div>
                <div class="grid grid-cols-[70px_1fr_90px] border-b border-blue-secondary">
                  <div class="p-2.5 border-r border-blue-secondary">0413</div>
                  <div class="p-2.5 border-r border-blue-secondary text-orange font-bold bg-orange/10">Industria</div>
                  <div class="p-2.5">b</div>
                </div>
                <div class="grid grid-cols-[70px_1fr_90px] border-b border-blue-secondary">
                  <div class="p-2.5 border-r border-blue-secondary">0414</div>
                  <div class="p-2.5 border-r border-blue-secondary">Comercio</div>
                  <div class="p-2.5 text-orange font-bold bg-orange/10">B</div>
                </div>
                <div class="grid grid-cols-[70px_1fr_90px]">
                  <div class="p-2.5 border-r border-blue-secondary">0415</div>
                  <div class="p-2.5 border-r border-blue-secondary text-orange font-bold bg-orange/10">ind</div>
                  <div class="p-2.5">C</div>
                </div>
              </div>
              
              <div class="text-xs text-orange font-semibold mt-3.5 flex items-center gap-1.5">
                <span>⚠</span> 4 inconsistências detectadas
              </div>
            </div>

            <!-- SETA DE TRANSFORMAÇÃO -->
            <div class="hidden md:flex items-center justify-center bg-[#F8FAFC] border-x border-blue-secondary/80">
              <svg class="w-7 h-7 text-blue-primary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            <!-- DASHBOARD DEPOIS DO TRATAMENTO -->
            <div class="p-8 bg-black-dark text-white">
              <div class="text-[11px] font-mono tracking-wider uppercase text-black-light mb-4 font-semibold">DASHBOARD — DEPOIS DO TRATAMENTO</div>
              
              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="bg-white/5 border border-white/10 p-3.5 rounded-lg">
                  <div class="text-[10px] font-mono text-black-light mb-1">CLIENTES</div>
                  <div class="font-display font-bold text-lg text-white">1.248</div>
                </div>
                <div class="bg-white/5 border border-white/10 p-3.5 rounded-lg">
                  <div class="text-[10px] font-mono text-black-light mb-1">FATURAMENTO</div>
                  <div class="font-display font-bold text-lg text-white">R$ 2,4M</div>
                </div>
                <div class="bg-white/5 border border-white/10 p-3.5 rounded-lg">
                  <div class="text-[10px] font-mono text-black-light mb-1">TICKET MÉDIO</div>
                  <div class="font-display font-bold text-lg text-white">R$ 1.971</div>
                </div>
                <div class="bg-white/5 border border-white/10 p-3.5 rounded-lg">
                  <div class="text-[10px] font-mono text-black-light mb-1">CLASSE A</div>
                  <div class="font-display font-bold text-lg text-white">72%</div>
                </div>
              </div>

              <div class="flex items-center gap-5 bg-white/5 p-3.5 rounded-lg border border-white/10">
                <svg class="w-16 h-16 shrink-0" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#575756" stroke-width="4"/>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#006EB7" stroke-width="4" stroke-dasharray="65 100" stroke-dashoffset="25" stroke-linecap="round"/>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#82CC12" stroke-width="4" stroke-dasharray="18 100" stroke-dashoffset="-40" stroke-linecap="round"/>
                </svg>
                <div class="text-xs text-blue-secondary space-y-1 font-medium">
                  <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-primary"></span> Indústria — 65%</div>
                  <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green"></span> Comércio — 18%</div>
                  <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-orange"></span> Serviços — 17%</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- SEÇÃO DE IMPACTO -->
      <section class="py-20 bg-black-dark text-white relative" id="sobre">
        <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-[1fr_1.3fr] gap-12 items-center">
          <div>
            <div class="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-4">O IMPACTO HOJE</div>
            <ul class="space-y-3 text-sm text-black-light">
              <li class="pb-3 border-b border-white/10">Dados preenchidos manualmente, planilha por planilha</li>
              <li class="pb-3 border-b border-white/10">Erros de digitação e inconsistências entre colunas</li>
              <li class="pb-3">Nenhuma análise automática ou cruzamento de dados</li>
            </ul>
          </div>
          <div>
            <div class="font-display font-semibold text-2xl md:text-4xl leading-snug">
              "Qual segmento traz <span class="text-green bg-green/10 px-2 py-0.5 rounded">mais retorno</span> para a empresa?"
            </div>
            <p class="mt-4 text-sm text-black-light leading-relaxed">
              Hoje, essa pergunta não tem resposta rápida. O CTI Nexus existe pra mudar isso.
            </p>
          </div>
        </div>
      </section>

      <!-- RECURSOS DA PLATAFORMA (FEATURES COM ARTICLES) -->
      <section class="py-20" id="recursos">
        <div class="max-w-7xl mx-auto px-6">
          <div class="max-w-xl mb-12">
            <h2 class="font-display font-bold text-3xl text-black-dark">Três etapas, uma planilha vira decisão.</h2>
          </div>

          <div class="grid md:grid-cols-3 gap-6">
            <article class="bg-white/85 backdrop-blur-sm p-8 rounded-xl border border-blue-secondary shadow-sm hover:shadow-md transition-all">
              <div class="w-8 h-1 bg-blue-primary rounded mb-5"></div>
              <h3 class="font-display font-bold text-lg mb-2 text-black-dark">Upload automático</h3>
              <p class="text-sm text-regular leading-relaxed">Envie a planilha .xlsx ou .csv direto no sistema — sem preparar nada antes, sem formatar manualmente.</p>
            </article>

            <article class="bg-white/85 backdrop-blur-sm p-8 rounded-xl border border-blue-secondary shadow-sm hover:shadow-md transition-all">
              <div class="w-8 h-1 bg-blue-primary rounded mb-5"></div>
              <h3 class="font-display font-bold text-lg mb-2 text-black-dark">Tratamento e padronização</h3>
              <p class="text-sm text-regular leading-relaxed">O sistema identifica e corrige inconsistências de segmento, nível e faturamento antes de qualquer análise.</p>
            </article>

            <article class="bg-white/85 backdrop-blur-sm p-8 rounded-xl border border-blue-secondary shadow-sm hover:shadow-md transition-all">
              <div class="w-8 h-1 bg-blue-primary rounded mb-5"></div>
              <h3 class="font-display font-bold text-lg mb-2 text-black-dark">Dashboards e insights</h3>
              <p class="text-sm text-regular leading-relaxed">Gráficos interativos e recomendações estratégicas geradas a partir dos dados já limpos — prontos pra decisão.</p>
            </article>
          </div>
        </div>
      </section>

      <!-- JORNADA DO USUÁRIO -->
      <section class="pb-20" id="jornada">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-xs font-mono font-bold tracking-widest uppercase text-regular mb-6">JORNADA DO USUÁRIO</div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white/85 backdrop-blur-sm p-6 rounded-xl border border-blue-secondary shadow-sm">
              <span class="font-mono text-xs font-bold text-blue-primary bg-blue-secondary/30 px-2.5 py-1 rounded">01</span>
              <h4 class="font-display font-bold text-base mt-3 mb-1 text-black-dark">Apresentação</h4>
              <p class="text-xs text-regular">Landing institucional do sistema.</p>
            </div>

            <div class="bg-white/85 backdrop-blur-sm p-6 rounded-xl border border-blue-secondary shadow-sm">
              <span class="font-mono text-xs font-bold text-blue-primary bg-blue-secondary/30 px-2.5 py-1 rounded">02</span>
              <h4 class="font-display font-bold text-base mt-3 mb-1 text-black-dark">Login</h4>
              <p class="text-xs text-regular">Autenticação para funcionários autorizados.</p>
            </div>

            <div class="bg-white/85 backdrop-blur-sm p-6 rounded-xl border border-blue-secondary shadow-sm">
              <span class="font-mono text-xs font-bold text-blue-primary bg-blue-secondary/30 px-2.5 py-1 rounded">03</span>
              <h4 class="font-display font-bold text-base mt-3 mb-1 text-black-dark">Upload</h4>
              <p class="text-xs text-regular">Envio e processamento da planilha.</p>
            </div>

            <div class="bg-white/85 backdrop-blur-sm p-6 rounded-xl border border-blue-secondary shadow-sm">
              <span class="font-mono text-xs font-bold text-blue-primary bg-blue-secondary/30 px-2.5 py-1 rounded">04</span>
              <h4 class="font-display font-bold text-base mt-3 mb-1 text-black-dark">Dashboards</h4>
              <p class="text-xs text-regular">Análise visual, KPIs e insights detalhados.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA BAND -->
      <section class="bg-black-dark text-white py-14">
        <div class="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
          <h2 class="font-display font-bold text-xl md:text-2xl max-w-lg leading-tight">
            Pare de gerenciar clientes na planilha. Comece a decidir com dado tratado.
          </h2>
          <a href="#" class="bg-blue-primary hover:bg-blue-primary-hover text-white px-7 py-3.5 rounded-lg font-semibold text-sm shadow-lg transition-all">
            Acessar sistema →
          </a>
        </div>
      </section>

    </main>

    <!-- RODAPÉ DA PÁGINA -->
    <footer>
      <div class="max-w-7xl mx-auto px-6 py-6 text-xs text-black-regular flex justify-between items-center flex-wrap gap-2">
        <span>© 2026 CTI Nexus</span>
        <span class="font-mono">Projeto Integrador — SENAI</span>
      </div>
    </footer>

  </div>
</template>

<script setup>
// Componente de Landing Page do CTI Nexus
</script>

