import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface Company {
  id: string;
  name: string;
  color: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  engine_name: string;
  year: number;
  image_url: string | null;
  preview_text: string | null;
  vehicles: string[] | null;
  specs: Record<string, string> | null;
  companies?: Company[];
}

export interface EngineRelationship {
  id: string;
  engine_id: string;
  related_engine_id: string;
  relationship_type: string;
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });
}

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*, post_companies(company_id, companies(*))")
        .order("year");
      if (error) throw error;
      return (posts ?? []).map((p: any) => ({
        ...p,
        companies: p.post_companies?.map((pc: any) => pc.companies).filter(Boolean) ?? [],
      })) as Post[];
    },
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_companies(company_id, companies(*))")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return {
        ...data,
        companies: data.post_companies?.map((pc: any) => pc.companies).filter(Boolean) ?? [],
      } as Post;
    },
    enabled: !!slug,
  });
}

export function useRelatedEngines(postId: string) {
  return useQuery({
    queryKey: ["related-engines", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engine_relationships")
        .select("*, related:related_engine_id(id, title, slug, engine_name, year, preview_text, post_companies(company_id, companies(*)))")
        .eq("engine_id", postId);
      
      if (error) throw error;

      // Also get reverse relationships
      const { data: reverse, error: err2 } = await supabase
        .from("engine_relationships")
        .select("*, related:engine_id(id, title, slug, engine_name, year, preview_text, post_companies(company_id, companies(*)))")
        .eq("related_engine_id", postId);

      if (err2) throw err2;

      const all = [
        ...(data ?? []).map((r: any) => ({
          ...r.related,
          relationship_type: r.relationship_type,
          companies: r.related?.post_companies?.map((pc: any) => pc.companies).filter(Boolean) ?? [],
        })),
        ...(reverse ?? []).map((r: any) => ({
          ...r.related,
          relationship_type: r.relationship_type,
          companies: r.related?.post_companies?.map((pc: any) => pc.companies).filter(Boolean) ?? [],
        })),
      ];
      return all;
    },
    enabled: !!postId,
  });
}

export function useEngineRelationships() {
  return useQuery({
    queryKey: ["engine-relationships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engine_relationships")
        .select("*");
      if (error) throw error;
      return data as EngineRelationship[];
    },
  });
}
