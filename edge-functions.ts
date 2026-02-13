
/**
 * Note: These are conceptual representations of the logic for Supabase Edge Functions.
 * Deployment requires individual files in supabase/functions/ directory.
 */

// POST /srv/upsert-objectives
export async function upsertObjectives(req: Request, supabase: any) {
  const { area_id, year, objectives } = await req.json();
  
  // Validation: Sum must be exactly 100
  const totalWeight = objectives.reduce((sum: number, obj: any) => sum + obj.annual_weight, 0);
  if (totalWeight !== 100) {
    return new Response(JSON.stringify({ error: "La suma de los pesos anuales debe ser exactamente 100." }), { status: 422 });
  }

  // Transaction logic (Supabase RPC or sequential with validation)
  // ... delete old ones not in the list, insert/update current ones ...
  return new Response(JSON.stringify({ success: true }));
}

// GET /srv/summary
export async function getSummary(req: Request, supabase: any) {
  const url = new URL(req.url);
  const area_id = url.searchParams.get('area_id');
  const year = url.searchParams.get('year');

  const { data: objectives, error } = await supabase
    .from('srv_objectives')
    .select('id, name, annual_weight, srv_plan_monthly(*), srv_exec_monthly(*)')
    .eq('area_id', area_id)
    .eq('year', year);

  if (error) return new Response(JSON.stringify(error), { status: 500 });

  const summary = objectives.map((obj: any) => {
    const plan = Array(12).fill(0);
    const exec = Array(12).fill(0);
    obj.srv_plan_monthly.forEach((p: any) => plan[p.month - 1] = p.planned_value);
    obj.srv_exec_monthly.forEach((e: any) => exec[e.month - 1] = e.executed_value);

    const sumPlan = plan.reduce((s, v) => s + v, 0);
    const sumExec = exec.reduce((s, v) => s + v, 0);
    const compliance = sumPlan > 0 ? (sumExec / sumPlan) * 100 : 0;

    let status = 'red';
    if (compliance >= 100) status = 'green';
    else if (compliance >= 80) status = 'yellow';

    return { id: obj.id, name: obj.name, annual_weight: obj.annual_weight, plan, exec, compliance, status };
  });

  return new Response(JSON.stringify({ objectives: summary }));
}
