export type Intent = {
  journeyId: string;
  label: string;
  to: string;
};

const RULES: Array<{ id: string; label: string; to: string; patterns: RegExp }> = [
  {
    id: "help",
    label: "Reportar problema urbano",
    to: "/jornada/preciso-de-ajuda",
    patterns:
      /(ilumina|poste|lâmpada|lampada|buraco|asfalt|árvore|arvore|entulho|lixo|esgoto|alagament|sinaliza|caíd|caid)/i,
  },
  {
    id: "health",
    label: "Saúde",
    to: "/jornada/minha-saude",
    patterns: /(consulta|médic|medic|exame|vacina|posto de saúde|ubs|remédio|remedio|dentista)/i,
  },
  {
    id: "education",
    label: "Educação",
    to: "/jornada/minha-educacao",
    patterns: /(creche|escola|matríc|matric|vaga|transporte escolar|professor)/i,
  },
  {
    id: "housing",
    label: "Casa e tributos",
    to: "/jornada/minha-casa",
    patterns: /(iptu|imposto|itbi|alvará|alvara|água|agua|energia|imóvel|imovel|terreno)/i,
  },
  {
    id: "family",
    label: "Família e assistência",
    to: "/jornada/minha-familia",
    patterns: /(benefíc|benefic|cadúnico|cadunico|bolsa|assistência|assistencia|idoso|criança|crianca)/i,
  },
  {
    id: "work",
    label: "Trabalho e renda",
    to: "/jornada/meu-trabalho",
    patterns: /(emprego|vaga de trabalho|curso|qualifica|mei|empresa|negóci|negoci)/i,
  },
  {
    id: "protocols",
    label: "Meus protocolos",
    to: "/protocolos",
    patterns: /(protocolo|andamento|solicita|documento|agendament|histórico|historico)/i,
  },
];

/** Classificação de intenção local — encaminha o cidadão para a jornada correta. */
export function detectIntent(text: string): Intent | null {
  const value = text.trim();
  if (value.length < 3) return null;
  for (const rule of RULES) {
    if (rule.patterns.test(value)) {
      return { journeyId: rule.id, label: rule.label, to: rule.to };
    }
  }
  return null;
}
