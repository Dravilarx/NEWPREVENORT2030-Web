/**
 * Habilidad B: Gestor_Remediación_IA
 * 
 * Este skill diseña planes de rescate médico para trabajadores que no han
 * cumplido con los estándares pero cuya condición es tratable.
 */

export interface HallazgoClinico {
    item: string;
    valor: string | number;
}

export interface PlanRemediacion {
    hallazgo_principal: string;
    plan_accion: string[];
    dias_estimados: number;
    probabilidad_exito: number;
}

export const diseñarPlanRemediacion = (
    hallazgos: HallazgoClinico[]
): PlanRemediacion => {
    const plan: string[] = [];
    let hallazgoPrincipal = "";
    let diasEstimados = 7;
    let probabilidadExito = 90;

    // Analizar hallazgos para construir el plan
    hallazgos.forEach(h => {
        const item = h.item.toLowerCase();

        if (item.includes('presión arterial')) {
            hallazgoPrincipal = "Hipertensión Arterial Leve";
            plan.push("Monitoreo de Presión Arterial (MAPA) por 7 días.");
            plan.push("Reducción de ingesta de sodio.");
            plan.push("Interconsulta con medicina interna o cardiología.");
            diasEstimados = Math.max(diasEstimados, 10);
            probabilidadExito = 85;
        }

        if (item.includes('glicemia')) {
            hallazgoPrincipal = hallazgoPrincipal || "Glicemia Elevada / Pre-diabetes";
            plan.push("Evaluación nutricional obligatoria.");
            plan.push("Repetición de examen de glicemia en ayuno en 7 días.");
            plan.push("Perfil lipídico complementario.");
            diasEstimados = Math.max(diasEstimados, 14);
            probabilidadExito = 95;
        }

        if (item.includes('imc') || item.includes('obesidad')) {
            hallazgoPrincipal = hallazgoPrincipal || "Riesgo Cardiovascular (IMC)";
            plan.push("Programa de acondicionamiento físico guiado.");
            plan.push("Seguimiento semanal de peso y perímetros.");
            diasEstimados = Math.max(diasEstimados, 30);
            probabilidadExito = 75;
        }
    });

    return {
        hallazgo_principal: hallazgoPrincipal || "Desviación Clínica General",
        plan_accion: plan.length > 0 ? plan : ["Evaluación médica integral de seguimiento."],
        dias_estimados: diasEstimados,
        probabilidad_exito: probabilidadExito
    };
};
