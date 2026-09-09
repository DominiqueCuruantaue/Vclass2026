-- Migration 035: Reversão automática de comissão de referência em reembolso
--
-- Fecha o gap "Refunds/chargebacks can reverse commission ⚠️ Manual only" do
-- blueprint. Até aqui, `subscriptions.status` só distinguia
-- active/cancelled/expired — não havia forma de marcar "reembolsado" de
-- "só cancelado" (uma renovação não paga não implica devolução de dinheiro).
-- Sem essa distinção não dava para saber QUANDO reverter automaticamente a
-- comissão de referência (Art. 21-24) sem arriscar reverter em cancelamentos
-- normais que não envolveram nenhum reembolso real.
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'cancelled', 'expired', 'refunded'));

-- `referral_attributions` guarda a atribuição por-estudante (para toda a
-- vida, Art. 21-24 "primeiro clique vence" — ver migration 031), mas nunca
-- guardou QUAL subscrição foi a "primeira compra elegível" que converteu a
-- comissão. Sem isso, reembolsar uma subscrição posterior de um estudante já
-- convertido poderia reverter a comissão erradamente (a subscrição
-- reembolsada podia não ter nada a ver com a que gerou a comissão).
-- `converted_subscription_id` fecha essa ambiguidade: só se a subscrição
-- reembolsada for exactamente esta é que a reversão automática dispara;
-- caso contrário fica de fora (mais seguro nunca reverter por engano do que
-- reverter a comissão errada) e continua a exigir o ajuste manual existente
-- (POST /api/finance/earnings/adjustment).
ALTER TABLE referral_attributions
  ADD COLUMN IF NOT EXISTS converted_subscription_id UUID REFERENCES subscriptions(id);
