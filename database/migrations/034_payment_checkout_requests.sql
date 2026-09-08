-- Migration 034: Registo de pedidos de checkout (referências de pagamento manual)
--
-- Sem gateway de pagamento real (M-Pesa/Stripe) integrado, POST /api/plans/subscribe
-- gerava uma referência de pagamento (ex. "VC-XXXXX") e devolvia-a ao utilizador
-- sem a guardar em lado nenhum — a equipa financeira não tinha como validar essa
-- referência mais tarde ao confirmar o pagamento fora do sistema. Esta tabela é
-- só um log do pedido (não activa nada sozinha); a activação real continua a ser
-- POST /api/finance/subscriptions, que agora pode citar `reference` como payment_id.

CREATE TABLE IF NOT EXISTS public.payment_checkout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id varchar(20) NOT NULL,
  billing varchar(10) NOT NULL,
  currency varchar(3) NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_method varchar(20),
  reference varchar(50) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_checkout_requests_user_created ON public.payment_checkout_requests(user_id, created_at);

ALTER TABLE public.payment_checkout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.payment_checkout_requests;
CREATE POLICY "service_role_only" ON public.payment_checkout_requests
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
