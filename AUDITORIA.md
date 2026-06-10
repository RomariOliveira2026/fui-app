# Auditoria Completa do App Fui! - 01/04/2026

## Problemas Críticos (quebram a experiência)

1. **Rotas /ride-history e /payments retornam 404** - As rotas corretas são `/rides` e não `/payments` (não existe). O menu/perfil pode estar linkando para URLs erradas.
2. **Painel do motorista mostra 345 corridas de teste** - Há centenas de corridas de teste no banco com dados falsos ("Origin", "Destination", "My Home", "My Work", "Far Location") que poluem o painel do motorista. Precisam ser removidas.
3. **Corridas com valor R$ 0.20** - Há corridas com preços absurdamente baixos (R$ 0.20) que são claramente de testes com dados inválidos.
4. **Tipo de veículo "utilitario" em minúsculo** - No painel do motorista aparece "utilitario" em vez de "Utilitário" com acento.

## Problemas Visuais (afetam apresentação)

5. **Prompts de notificação e instalação aparecem sobrepostos** - Dois prompts aparecem ao mesmo tempo (notificação + instalação PWA), poluindo a tela.
6. **Painel do motorista: 0 corridas realizadas** - Mesmo sendo motorista aprovado, mostra 0 corridas. Correto pois não fez corridas ainda, mas pode confundir.

## O que está funcionando bem

- Home com mapa ✅
- Tela de solicitar corrida ✅  
- Painel administrativo ✅
- Perfil do usuário ✅
- Painel do motorista (estrutura) ✅
- Sistema de notificações ✅
- Cupons ✅
- Analytics ✅

## Ações necessárias

1. Limpar corridas de teste do banco de dados
2. Corrigir links de navegação quebrados (/ride-history → /rides)
3. Corrigir capitalização do tipo de veículo
4. Melhorar gestão dos prompts (não mostrar dois ao mesmo tempo)
