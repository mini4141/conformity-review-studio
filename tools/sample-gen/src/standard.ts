import type { Clause, Standard } from '@crs/shared';

// [section title, [[group title, [clause titles x3]] x5]]. Original text for a fictional standard.
const SECTIONS: [string, [string, string[]][]][] = [
  ['General requirements', [
    ['Quality system', ['Quality policy', 'Document control', 'Management review']],
    ['Intended use', ['Intended purpose statement', 'Patient population', 'Use environment']],
    ['Device classification', ['Classification rationale', 'Applicable rules', 'Conformity route']],
    ['Supplier control', ['Supplier evaluation', 'Incoming inspection', 'Change notification']],
    ['Traceability', ['Unique device identification', 'Lot and serial records', 'Component genealogy']],
  ]],
  ['Risk management', [
    ['Risk plan', ['Risk management plan', 'Acceptability criteria', 'Personnel competence']],
    ['Hazard analysis', ['Hazard identification', 'Hazardous situations', 'Foreseeable misuse']],
    ['Risk evaluation', ['Risk estimation', 'Risk evaluation matrix', 'Benefit-risk analysis']],
    ['Risk control', ['Control measure selection', 'Residual risk review', 'Control verification']],
    ['Risk file', ['Risk management report', 'Production feedback', 'Risk file review']],
  ]],
  ['Essential performance', [
    ['Delivery accuracy', ['Flow rate accuracy', 'Volume accuracy', 'Bolus accuracy']],
    ['Delivery range', ['Minimum flow rate', 'Maximum flow rate', 'Rate resolution']],
    ['Occlusion response', ['Occlusion detection time', 'Occlusion pressure limit', 'Bolus after occlusion']],
    ['Air in line', ['Air bubble detection', 'Air volume limit', 'Air alarm response']],
    ['Start-up behaviour', ['Start-up delay', 'Prime function', 'Flow stabilisation']],
  ]],
  ['Mechanical safety', [
    ['Enclosure', ['Enclosure rigidity', 'Impact resistance', 'Drop resistance']],
    ['Moving parts', ['Pinch point protection', 'Door interlock', 'Plunger drive guarding']],
    ['Stability', ['Pole clamp stability', 'Tilt stability', 'Transport vibration']],
    ['Ingress', ['Liquid ingress rating', 'Particle ingress rating', 'Cleaning agent resistance']],
    ['Mounting', ['Pole clamp strength', 'Bed rail hook strength', 'Stacking mounts']],
  ]],
  ['Electrical safety', [
    ['Protective earthing', ['Earth continuity', 'Earth terminal marking', 'Earth impedance']],
    ['Insulation', ['Dielectric strength', 'Creepage distances', 'Clearance distances']],
    ['Mains supply', ['Supply voltage range', 'Power cord retention', 'Inlet fusing']],
    ['Leakage currents', ['Earth leakage current', 'Patient leakage current', 'Touch current']],
    ['Battery operation', ['Battery run time', 'Battery charging safety', 'Low battery warning']],
  ]],
  ['Software lifecycle', [
    ['Software planning', ['Software development plan', 'Software safety classification', 'Configuration management']],
    ['Requirements', ['Software requirements', 'Requirements traceability', 'Requirements review']],
    ['Architecture', ['Architecture description', 'Segregation of items', 'SOUP identification']],
    ['Verification', ['Unit verification', 'Integration testing', 'System testing']],
    ['Release', ['Release criteria', 'Known anomalies', 'Version identification']],
  ]],
  ['Usability', [
    ['Usability planning', ['Use specification', 'User interface specification', 'Usability plan']],
    ['Task analysis', ['Critical task list', 'Use error analysis', 'Task risk ranking']],
    ['Formative evaluation', ['Early prototype study', 'Interface revision log', 'Expert review']],
    ['Summative evaluation', ['Participant selection', 'Simulated use test', 'Residual use errors']],
    ['Training', ['Training materials', 'Quick reference card', 'In-service guidance']],
  ]],
  ['Biological safety', [
    ['Contact assessment', ['Contact categorisation', 'Fluid path materials', 'Exposure duration']],
    ['Cytotoxicity', ['Extract preparation', 'Cell response grading', 'Cytotoxicity report']],
    ['Sensitisation', ['Sensitisation protocol', 'Skin reaction grading', 'Sensitisation report']],
    ['Particulates', ['Particulate limits', 'Extractables profile', 'Leachables profile']],
    ['Biological evaluation', ['Biological evaluation plan', 'Gap analysis', 'Biological evaluation report']],
  ]],
  ['Labelling', [
    ['Device marking', ['Device label content', 'Symbol usage', 'Label durability']],
    ['Instructions', ['Instructions for use content', 'Warnings and cautions', 'Language requirements']],
    ['Packaging labels', ['Carton label content', 'Shipping marks', 'Storage conditions marking']],
    ['Accompanying documents', ['Service manual', 'Technical description', 'Cleaning instructions']],
    ['Electronic labelling', ['On-screen markings', 'Electronic instructions', 'Version display']],
  ]],
  ['Packaging and sterility', [
    ['Disposable set', ['Set sterility assurance', 'Sterilisation validation', 'Bioburden control']],
    ['Packaging design', ['Package integrity', 'Seal strength', 'Shelf life']],
    ['Transport', ['Transport simulation', 'Temperature excursions', 'Vibration conditioning']],
    ['Cleaning', ['Cleaning validation', 'Disinfection compatibility', 'Reprocessing limits']],
    ['Storage', ['Storage temperature range', 'Humidity range', 'Storage handling']],
  ]],
  ['Alarm systems', [
    ['Alarm priorities', ['Priority assignment', 'Alarm condition list', 'Priority escalation']],
    ['Audible signals', ['Alarm sound level', 'Tone pattern', 'Volume adjustment']],
    ['Visual signals', ['Indicator colours', 'Flash rates', 'Message clarity']],
    ['Alarm behaviour', ['Alarm latency', 'Alarm pause', 'Alarm reset']],
    ['System faults', ['Technical fault alarms', 'Watchdog response', 'Alarm on power loss']],
  ]],
  ['Post-market surveillance', [
    ['Surveillance plan', ['Surveillance plan content', 'Data sources', 'Review frequency']],
    ['Complaint handling', ['Complaint intake', 'Complaint investigation', 'Trend analysis']],
    ['Vigilance', ['Incident reporting', 'Field safety notices', 'Regulator interface']],
    ['Clinical follow-up', ['Follow-up plan', 'Literature monitoring', 'Follow-up report']],
    ['Periodic reporting', ['Periodic safety report', 'Corrective action tracking', 'Report approval']],
  ]],
];

const STOP = new Set(['and', 'of', 'the', 'for', 'on', 'in', 'to', 'a']);
const TEMPLATES = [
  (t: string) => `The manufacturer shall define and document ${t}, and shall provide objective evidence that the defined criteria are met.`,
  (t: string) => `Evidence for ${t} shall be traceable to a controlled test report or record referenced in the technical file.`,
  (t: string) => `${t[0]!.toUpperCase()}${t.slice(1)} shall be verified under normal and single-fault conditions, with results recorded against the stated limits.`,
];

export function buildStandard(): Standard {
  const clauses: Clause[] = [];
  SECTIONS.forEach(([sectionTitle, groups], si) => {
    const section = String(4 + si);
    groups.forEach(([group, titles], gi) => {
      titles.forEach((title, ci) => {
        const lower = title.toLowerCase();
        clauses.push({
          id: `${section}.${gi + 1}.${ci + 1}`,
          section,
          sectionTitle,
          group,
          title,
          text: TEMPLATES[ci % 3]!(lower),
          keywords: lower.split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)),
        });
      });
    });
  });
  return { id: 'TS-60601-SIM', title: 'TS-60601-SIM: Simulated safety and performance standard for infusion pumps (fictional)', clauses };
}
