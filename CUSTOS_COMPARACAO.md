# Comparação de Custos: AWS vs Vercel

## 📊 Análise Detalhada de Custos

### Cenário: Grupo pequeno (~50 usuários ativos/mês)

| Critério | AWS Amplify + CloudFront | Vercel |
|----------|--------------------------|---------|
| **Build minutes** | 1000 min/mês (Free Tier) | 6000 min/mês (Hobby) |
| **Bandwidth** | 15GB + 1TB CloudFront (Free Tier) | 100GB (Hobby) |
| **Serverless Functions** | Via Supabase Edge Functions | 100GB-hours (Hobby) |
| **Preview Deploys** | ✅ Ilimitado | ✅ Ilimitado |
| **SSL/TLS** | ✅ Grátis (CloudFront) | ✅ Grátis |
| **CDN Global** | ✅ CloudFront (225+ PoPs) | ✅ Edge Network |
| **CI/CD** | GitHub Actions (2000 min free) | Vercel Git integration |
| **Monitoramento** | CloudWatch (5GB free) | Analytics (requer Pro) |
| **Secrets Management** | SSM Parameter Store (free) | Environment Variables |
| **Custo Mês 1-12** | **$0-2** | **$0** (Hobby) |
| **Custo Mês 13+** | **$3-7** | **$0** (Hobby) |
| **Custo Alto Tráfego** | **$10-20** | **$20+** (Pro obrigatório) |

---

## 💰 Breakdown Detalhado

### AWS Amplify + CloudFront

#### Free Tier (12 meses)
```
Build minutes: 1000/mês      → Projeto usa ~200 → $0
Hosting: 15GB served/mês     → Projeto usa ~3GB  → $0
CloudFront: 1TB transfer     → Projeto usa ~20GB → $0
Requests: 10M/mês            → Projeto usa ~50K  → $0
SSM Parameters: Ilimitado    → Projeto usa 5     → $0
CloudWatch: 5GB logs         → Projeto usa ~500MB → $0
GitHub Actions: 2000 min     → Projeto usa ~150  → $0
──────────────────────────────────────────────────────
TOTAL: $0/mês
```

#### Após Free Tier (Mês 13+)
```
Build minutes: $0.01/min     → 200 min   → $2.00
Hosting: $0.15/GB            → 3GB        → $0.45
CloudFront: $0.085/GB        → 20GB       → $1.70
Requests: $0.0075/10K        → 50K reqs   → $0.04
SSM: Grátis (Standard)                    → $0.00
CloudWatch: $0.50/GB         → 500MB      → $0.25
──────────────────────────────────────────────────────
TOTAL: $4.44/mês
```

#### Tráfego Alto (500 usuários, 500GB bandwidth)
```
Build: $2.00 (200 min)
Hosting: $0.45 (3GB stored)
CloudFront: $42.50 (500GB transfer @ $0.085/GB)
Requests: $0.30 (400K requests)
Outros: $0.25
──────────────────────────────────────────────────────
TOTAL: $45.50/mês
```

**⚠️ Nota:** Ainda mais barato que Vercel Pro ($20/mês base + $40/TB extra)

---

### Vercel

#### Hobby Plan (Grátis)
```
Build minutes: 6000/mês      → Projeto usa ~200 → $0
Bandwidth: 100GB/mês         → Projeto usa ~3GB  → $0
Serverless: 100GB-hours      → Uso moderado     → $0
Domains: 1 grátis            → 1 domínio        → $0
──────────────────────────────────────────────────────
TOTAL: $0/mês (uso pessoal/não-comercial)
```

#### Pro Plan ($20/mês + overages)
```
Base: $20/usuário/mês
Build minutes: 6000 inclusos → $0.40/100 min extra
Bandwidth: 1TB incluído      → $40/TB extra
Serverless: 1000GB-hours     → $0.10/GB-hour extra
──────────────────────────────────────────────────────
TOTAL: $20-60/mês (uso comercial)
```

#### Tráfego Alto (500 usuários, 500GB bandwidth)
```
Base Pro: $20/mês
Build: $0 (dentro dos 6000 min)
Bandwidth: ~$0 (500GB < 1TB incluído)
Serverless: ~$5 (uso adicional)
──────────────────────────────────────────────────────
TOTAL: $25/mês
```

**⚠️ Nota:** Hobby plan não pode ser usado para fins comerciais

---

## 🎯 Recomendações por Cenário

### 1. Projeto Pessoal / Protótipo
**Vencedor: Vercel Hobby (Grátis)**

✅ Setup mais rápido  
✅ 100% gratuito  
✅ Ótimo para MVP  

❌ Não pode ser usado comercialmente  
❌ Limitado a 100GB bandwidth  

**Quando migrar para AWS:** Quando lançar comercialmente ou crescer.

---

### 2. Projeto Comercial (Startup)
**Vencedor: AWS Amplify ($0-7/mês)**

✅ Custo mínimo primeiro ano (Free Tier)  
✅ Mais controle sobre infraestrutura  
✅ Melhor para compliance (LGPD/SOC2)  
✅ Escalável até 1TB por ~$40  

❌ Setup mais complexo (requer AWS CLI, IAM, etc)  
❌ Curva de aprendizado maior  

**Quando usar Vercel Pro:** Se time é pequeno e valoriza simplicidade > custo.

---

### 3. Scale-up (1000+ usuários)
**Vencedor: AWS Amplify ($50-150/mês)**

Vs Vercel Pro ($60-200/mês):

```
AWS @ 2TB/mês:
  CloudFront: $85 (1TB free tier + 1TB paid @ $0.085/GB)
  Amplify: ~$5
  Outros: ~$5
  TOTAL: ~$95/mês

Vercel Pro @ 2TB/mês:
  Base: $20
  Extra bandwidth: $40 (1TB extra @ $40/TB)
  TOTAL: ~$60/mês (mas $20/user se crescer time)
```

**Ambos ficam caros em alta escala.** Considerar:
- **Cloudflare Pages** (grátis ilimitado)
- **Netlify** (similar ao Vercel)
- **AWS S3 + CloudFront** direto (mais barato, mais trabalho)

---

## 🔐 Fatores Além do Custo

| Fator | AWS Amplify | Vercel |
|-------|-------------|--------|
| **Segurança** | ⭐⭐⭐⭐⭐ (IAM, SSM, CloudTrail) | ⭐⭐⭐⭐ (Env vars) |
| **Compliance** | ⭐⭐⭐⭐⭐ (SOC2, HIPAA, PCI) | ⭐⭐⭐⭐ (SOC2) |
| **Developer Experience** | ⭐⭐⭐ (mais complexo) | ⭐⭐⭐⭐⭐ (mais simples) |
| **Vendor Lock-in** | ⭐⭐⭐ (AWS ecosystem) | ⭐⭐⭐⭐ (mais fácil migrar) |
| **Monitoramento** | ⭐⭐⭐⭐⭐ (CloudWatch completo) | ⭐⭐⭐ (Analytics Pro) |
| **Customização** | ⭐⭐⭐⭐⭐ (controle total) | ⭐⭐⭐ (limitado) |
| **Build Speed** | ⭐⭐⭐ (~5-10 min) | ⭐⭐⭐⭐⭐ (~2-5 min) |
| **Deploy Speed** | ⭐⭐⭐⭐ (CloudFront CDN) | ⭐⭐⭐⭐⭐ (Edge Network) |

---

## 📈 Projeção de Custos (12 meses)

### Cenário: Crescimento gradual (10 → 200 usuários)

```
Mês    Usuários  AWS      Vercel
────────────────────────────────
1-3    10-30     $0       $0
4-6    30-60     $0       $0
7-9    60-120    $0       $0*
10-12  120-200   $0       $20*
13-15  200-300   $5       $20
16-18  300-500   $7       $20
19-21  500-1000  $15      $30
22-24  1000+     $40      $60
────────────────────────────────
TOTAL  (24 meses) $67     $250

* Vercel Hobby não permite uso comercial
  Pro obrigatório a partir de Mês 10
```

**Economia com AWS:** $183 em 2 anos

---

## 🎯 Decisão Final

### Use **AWS Amplify** se:
- ✅ Projeto comercial desde o início
- ✅ Quer custo mínimo a longo prazo
- ✅ Precisa de compliance rigoroso
- ✅ Time confortável com DevOps/AWS
- ✅ Planeja escalar para 500+ usuários

### Use **Vercel** se:
- ✅ MVP rápido / prototipagem
- ✅ Time pequeno sem expertise AWS
- ✅ Uso não-comercial (Hobby OK)
- ✅ Valoriza Developer Experience
- ✅ Não vai ultrapassar 100GB bandwidth/mês

---

## 💡 Otimizações de Custo

### Para AWS:
1. ✅ Use **CloudFront cache agressivo** (90%+ cache hit rate)
2. ✅ Habilite **Brotli compression** (reduz 30% bandwidth)
3. ✅ Configure **CloudWatch log retention** (7 dias suficiente)
4. ✅ Use **S3 Intelligent-Tiering** para assets estáticos
5. ✅ Implemente **budget alerts** (alerta em $5, $10, $20)

### Para Vercel:
1. ✅ Fique no **Hobby plan** enquanto possível
2. ✅ Use **Edge Middleware** para cache
3. ✅ Otimize **bundle size** (reduz bandwidth)
4. ✅ Use **Image Optimization** do Next.js
5. ✅ Monitore **bandwidth usage** mensalmente

---

## 📞 Resumo Executivo

**Para Pequenos Grupos Manager:**

- **Fase 1 (MVP/Testes):** Vercel Hobby (grátis)
- **Fase 2 (Lançamento):** AWS Amplify (custo mínimo)
- **Fase 3 (Escala):** AWS Amplify + otimizações

**ROI:** Economia de ~$200/ano vs Vercel Pro

**Recomendação:** 
- 🏆 **AWS Amplify** (se tiver 1-2h para setup inicial)
- 🥈 **Vercel** (se precisa deploy em 10min)

---

**Atualizado:** Fevereiro 2026  
**Próxima revisão:** Verificar preços trimestralmente
