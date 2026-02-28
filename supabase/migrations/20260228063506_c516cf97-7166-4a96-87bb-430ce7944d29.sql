
-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888888',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are publicly readable" ON public.companies FOR SELECT USING (true);

-- Posts table (engines/blog articles)
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  engine_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  image_url TEXT,
  preview_text TEXT,
  vehicles TEXT[],
  specs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are publicly readable" ON public.posts FOR SELECT USING (true);

-- Junction table: post <-> company (many-to-many)
CREATE TABLE public.post_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  UNIQUE(post_id, company_id)
);

ALTER TABLE public.post_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post companies are publicly readable" ON public.post_companies FOR SELECT USING (true);

-- Engine relationships table
CREATE TABLE public.engine_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engine_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  related_engine_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (engine_id != related_engine_id)
);

ALTER TABLE public.engine_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Engine relationships are publicly readable" ON public.engine_relationships FOR SELECT USING (true);

-- Timestamp trigger for posts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
