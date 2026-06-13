import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Car,
  Coins,
  Gift,
  LayoutDashboard,
  MapPin,
  Package,
  Settings2,
  Smartphone,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";

export type LandingModule = {
  name: string;
  description: string;
  icon: LucideIcon;
};

export type LandingPlan = {
  name: string;
  tagline: string;
  highlights: string[];
  featured?: boolean;
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export type LandingScreen = {
  title: string;
  subtitle: string;
  caption: string;
  accent: string;
  variant: "passenger" | "driver" | "admin" | "delivery" | "utility" | "finance" | "intel";
  featured?: boolean;
};

export const LANDING_NAV = [
  { id: "solucao", label: "Solução" },
  { id: "modulos", label: "Módulos" },
  { id: "monetizacao", label: "Receita" },
  { id: "produto", label: "Produto" },
  { id: "implantacao", label: "Implantação" },
  { id: "planos", label: "Planos" },
  { id: "captacao", label: "Contato" },
  { id: "faq", label: "FAQ" },
] as const;

export const HERO_BENEFIT_CHIPS = [
  { label: "Plataforma multi-serviços", icon: Sparkles },
  { label: "7 fontes de receita", icon: Coins },
  { label: "8+ módulos integrados", icon: LayoutDashboard },
  { label: "Mobilidade + logística urbana", icon: Car },
] as const;

export const HERO_MICROCOPY = [
  "Plataforma multi-serviços",
  "Mobilidade + logística urbana",
  "Estrutura pronta para operação local",
  "Ideal para cidades estratégicas",
] as const;

export const PAIN_POINTS = [
  { title: "Dependência de aplicativos externos", icon: MapPin },
  { title: "Fretes e mudanças desorganizados", icon: Truck },
  { title: "Baixa integração entre serviços", icon: Settings2 },
  { title: "Pouca inteligência operacional", icon: BarChart3 },
  { title: "Baixa capacidade de monetização local", icon: Coins },
] as const;

export const SOLUTION_ITEMS = [
  "Mobilidade urbana",
  "Entregas",
  "Fretes rápidos",
  "Mudanças pequenas",
  "Retirada em loja",
  "Utilitários",
  "Transporte comercial",
  "Gestão operacional",
  "Controle financeiro",
  "Inteligência administrativa",
] as const;

export const LANDING_MODULES: LandingModule[] = [
  {
    name: "App do Passageiro",
    description: "Experiência completa para solicitar corridas, entregas e serviços urbanos.",
    icon: Smartphone,
  },
  {
    name: "Painel do Motorista",
    description: "Gestão de corridas, ganhos, veículos e disponibilidade em tempo real.",
    icon: Car,
  },
  {
    name: "Entregas Premium",
    description: "Fluxo dedicado para entregas com rastreio, chat e operação profissional.",
    icon: Package,
  },
  {
    name: "Fui Utilitários",
    description: "Fretes, mudanças e serviços utilitários com matching inteligente.",
    icon: Truck,
  },
  {
    name: "Central Operacional",
    description: "Visão em tempo real da operação, corridas, entregas e prestadores.",
    icon: LayoutDashboard,
  },
  {
    name: "Financeiro / Admin",
    description: "Comissões, repasses, cupons e controle financeiro da operação local.",
    icon: Wallet,
  },
  {
    name: "Inteligência Operacional",
    description: "Métricas, tendências e decisões baseadas em dados da sua cidade.",
    icon: BarChart3,
  },
  {
    name: "Cupons e Indique e Ganhe",
    description: "Campanhas de aquisição, retenção e crescimento orgânico local.",
    icon: Gift,
  },
];

export const REVENUE_STREAMS = [
  "Comissão por corrida",
  "Comissão por entrega",
  "Comissão por utilitários",
  "Taxas de frete e mudança",
  "Serviços comerciais",
  "Campanhas e cupons",
  "Parcerias com negócios locais",
] as const;

export const TARGET_PROFILES = [
  "Empresários do setor de transporte",
  "Investidores regionais",
  "Grupos com capacidade operacional",
  "Donos de frota",
  "Cooperativas",
  "Operadores logísticos",
  "Empresários locais com visão de escala",
] as const;

export const DIFFERENTIALS = [
  { title: "Operação local forte", icon: Building2 },
  { title: "Mobilidade + entregas + utilitários", icon: Zap },
  { title: "Gestão real da operação", icon: LayoutDashboard },
  { title: "Maior potencial de monetização", icon: Coins },
  { title: "Expansão natural para logística urbana", icon: Truck },
  { title: "Estrutura pronta para crescimento", icon: Sparkles },
] as const;

export const LANDING_SCREENS: LandingScreen[] = [
  {
    title: "App do Passageiro",
    subtitle: "Corridas, entregas e utilitários em um só lugar",
    caption: "Interface pronta para uso comercial",
    accent: "from-primary/30 via-primary/10 to-transparent",
    variant: "passenger",
    featured: true,
  },
  {
    title: "Central Operacional",
    subtitle: "Monitoramento em tempo real da operação",
    caption: "Visão executiva da operação local",
    accent: "from-blue-500/20 via-primary/10 to-transparent",
    variant: "admin",
    featured: true,
  },
  {
    title: "Painel do Motorista",
    subtitle: "Ganhos, corridas ativas e gestão de frota",
    caption: "Fluxo completo para prestadores",
    accent: "from-emerald-500/20 via-primary/10 to-transparent",
    variant: "driver",
  },
  {
    title: "Fui Utilitários",
    subtitle: "Fretes, mudanças e serviços especializados",
    caption: "Nova frente de receita urbana",
    accent: "from-amber-500/25 via-primary/10 to-transparent",
    variant: "utility",
    featured: true,
  },
  {
    title: "Entregas Premium",
    subtitle: "Rastreio, chat e fluxo profissional",
    caption: "Operação logística com padrão premium",
    accent: "from-violet-500/20 via-primary/10 to-transparent",
    variant: "delivery",
  },
  {
    title: "Financeiro",
    subtitle: "Comissões, repasses e controle administrativo",
    caption: "Gestão financeira integrada",
    accent: "from-rose-500/20 via-primary/10 to-transparent",
    variant: "finance",
  },
  {
    title: "Inteligência",
    subtitle: "Métricas e visão estratégica da operação",
    caption: "Decisões baseadas em dados locais",
    accent: "from-cyan-500/20 via-primary/10 to-transparent",
    variant: "intel",
  },
];

export const IMPLANTATION_STEPS = [
  {
    step: "01",
    title: "Diagnóstico e apresentação",
    description: "Entendimento da cidade, perfil de operação e demonstração da plataforma.",
  },
  {
    step: "02",
    title: "Implantação e configuração",
    description: "Marca, módulos, parâmetros comerciais e estrutura administrativa.",
  },
  {
    step: "03",
    title: "Ativação local",
    description: "Lançamento com suporte, treinamento e acompanhamento operacional.",
  },
  {
    step: "04",
    title: "Crescimento e expansão",
    description: "Escala de serviços, campanhas e ampliação de receita na região.",
  },
] as const;

export const LANDING_PLANS: LandingPlan[] = [
  {
    name: "Cidade Start",
    tagline: "Entrada estratégica para estruturar mobilidade local com marca própria.",
    highlights: [
      "Implantação guiada e configuração inicial",
      "Licença da plataforma Fui",
      "Módulos essenciais de mobilidade",
      "Suporte na ativação da operação",
    ],
  },
  {
    name: "Cidade Pro",
    tagline: "Para quem quer operar múltiplos serviços com escala e controle real.",
    highlights: [
      "Tudo do Start, ampliado",
      "Entregas Premium e Fui Utilitários",
      "Central operacional completa",
      "Suporte prioritário na operação",
      "Campanhas, cupons e crescimento local",
    ],
    featured: true,
  },
  {
    name: "Cidade Premium",
    tagline: "Visão territorial, exclusividade e expansão com acompanhamento estratégico.",
    highlights: [
      "Tudo do Pro, com prioridade máxima",
      "Exclusividade territorial sob consulta",
      "Inteligência operacional avançada",
      "Acompanhamento comercial dedicado",
      "Expansão para novas cidades",
    ],
  },
];

export const LANDING_STATS = [
  { value: "8+", label: "Módulos integrados" },
  { value: "7", label: "Fontes de receita" },
  { value: "1", label: "Plataforma unificada" },
  { value: "100%", label: "Operação local" },
] as const;

export const STRATEGIC_CITIES = [
  "Aracaju",
  "Itabaiana",
  "Arapiraca",
  "Petrolina",
  "Feira de Santana",
] as const;

export const LANDING_FAQ: LandingFaq[] = [
  {
    question: "O Fui é apenas um app de corrida?",
    answer:
      "Não. O Fui é uma plataforma completa para operar mobilidade urbana, entregas, fretes, mudanças e utilitários em uma única estrutura, com gestão administrativa e múltiplas fontes de receita.",
  },
  {
    question: "O sistema já está pronto?",
    answer:
      "Sim. A plataforma possui módulos desenvolvidos, painéis operacionais, fluxos funcionais e base concreta para implantação e apresentação comercial na sua cidade.",
  },
  {
    question: "É possível operar com marca própria?",
    answer:
      "Sim. A implantação permite personalização de marca, identidade visual e operação local com posicionamento próprio no mercado da cidade.",
  },
  {
    question: "O Fui também atende fretes e mudanças?",
    answer:
      "Sim. O módulo Fui Utilitários cobre fretes rápidos, mudanças pequenas e serviços especializados, ampliando o potencial de faturamento da operação.",
  },
  {
    question: "Como o parceiro monetiza a operação?",
    answer:
      "Por meio de comissões por corrida, entrega e utilitários, taxas de frete e mudança, serviços comerciais, campanhas, cupons e parcerias com negócios locais.",
  },
  {
    question: "Existe suporte na implantação?",
    answer:
      "Sim. O processo inclui diagnóstico, configuração, ativação local e acompanhamento para estruturar uma operação com capacidade real de crescimento.",
  },
  {
    question: "É possível ter exclusividade por cidade?",
    answer:
      "Dependendo do perfil e do plano, é possível avaliar exclusividade territorial para cidades estratégicas, garantindo posicionamento diferenciado no mercado local.",
  },
];
