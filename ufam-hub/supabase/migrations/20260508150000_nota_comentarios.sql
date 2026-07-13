-- Comentários na nota (editor): a tabela pode já existir para links partilhados
-- (nota_compartilhada_id + comentario). Este script adiciona suporte a comentários
-- na tua própria nota (nota_id).

-- 1) Comentários do editor não usam link partilhado — coluna tem de aceitar NULL
ALTER TABLE public.nota_comentarios
  ALTER COLUMN nota_compartilhada_id DROP NOT NULL;

-- 2) FK para a nota normal (painel lateral do editor)
ALTER TABLE public.nota_comentarios
  ADD COLUMN IF NOT EXISTS nota_id uuid REFERENCES public.notas (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_nota_comentarios_nota_id
  ON public.nota_comentarios (nota_id);

-- 3) RLS — comentários ligados à tua nota (nota_id preenchido)
ALTER TABLE public.nota_comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nota_comentarios_select_own" ON public.nota_comentarios;
CREATE POLICY "nota_comentarios_select_own"
  ON public.nota_comentarios
  FOR SELECT
  TO authenticated
  USING (
    nota_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.notas n
      WHERE n.id = nota_comentarios.nota_id
        AND n.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "nota_comentarios_insert_own" ON public.nota_comentarios;
CREATE POLICY "nota_comentarios_insert_own"
  ON public.nota_comentarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    nota_id IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.notas n
      WHERE n.id = nota_comentarios.nota_id
        AND n.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "nota_comentarios_delete_own" ON public.nota_comentarios;
CREATE POLICY "nota_comentarios_delete_own"
  ON public.nota_comentarios
  FOR DELETE
  TO authenticated
  USING (nota_id IS NOT NULL AND auth.uid() = user_id);
