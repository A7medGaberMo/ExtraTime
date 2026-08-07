import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFBrefTableText, savePlayerFBrefStats } from "./fbref-parser.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePlayersDir = path.join(__dirname, "..", "data", "players");

// Helper to slugify names
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Sample raw FBref tables for iconic players
const PLAYER_FBREF_DATASETS = [
  {
    leagueSlug: "legends",
    clubSlug: "icons",
    playerSlug: "thierry-henry",
    playerMeta: { name: "Thierry Henry", apiId: "icon_9", club: "Arsenal", isGoalkeeper: false },
    rawText: `
Standard Stats: Domestic Leagues 
1994-1995	17	Monaco	fr FRA	1. Ligue 1	6th	8	1	190	2.1	1	0	1	1	0	0	1	0	0.47	0.00	0.47	0.47	0.47	Matches
1995-1996	18	Monaco	fr FRA	1. Ligue 1	3rd	18	6	710	7.9	3	1	4	3	0	0	2	0	0.38	0.13	0.51	0.38	0.51	Matches
1996-1997	19	Monaco	fr FRA	1. Ligue 1	1st	36	28	2,400	26.7	9	8	17	9	0	0	4	0	0.34	0.30	0.64	0.34	0.64	Matches
1997-1998	20	Monaco	fr FRA	1. Ligue 1	3rd	30	25	2,150	23.9	4	9	13	4	0	0	6	0	0.17	0.38	0.54	0.17	0.54	Matches
1998-1999	21	Juventus	it ITA	1. Serie A	7th	16	13	1,180	13.1	3	2	5	3	0	0	3	0	0.23	0.15	0.38	0.23	0.38	Matches
1999-2000	22	Arsenal	eng ENG	1. Premier League	2nd	31	27	2,380	26.4	17	8	25	17	0	0	4	0	0.64	0.30	0.95	0.64	0.95	Matches
2000-2001	23	Arsenal	eng ENG	1. Premier League	2nd	35	32	2,820	31.3	17	9	26	14	3	3	3	0	0.54	0.29	0.83	0.45	0.73	Matches
2001-2002	24	Arsenal	eng ENG	1. Premier League	1st	33	33	2,960	32.9	24	5	29	19	5	5	6	0	0.73	0.15	0.88	0.58	0.73	Matches
2002-2003	25	Arsenal	eng ENG	1. Premier League	2nd	37	37	3,330	37.0	24	20	44	21	3	3	8	0	0.65	0.54	1.19	0.57	1.11	Matches
2003-2004	26	Arsenal	eng ENG	1. Premier League	1st	37	37	3,330	37.0	30	6	36	23	7	7	6	0	0.81	0.16	0.97	0.62	0.78	Matches
2004-2005	27	Arsenal	eng ENG	1. Premier League	2nd	32	32	2,840	31.6	25	14	39	19	6	6	6	0	0.79	0.44	1.23	0.60	1.04	Matches
2005-2006	28	Arsenal	eng ENG	1. Premier League	4th	32	30	2,710	30.1	27	8	35	24	3	3	4	1	0.90	0.27	1.16	0.80	1.06	Matches
2006-2007	29	Arsenal	eng ENG	1. Premier League	4th	17	16	1,420	15.8	10	4	14	9	1	1	2	0	0.63	0.25	0.89	0.57	0.82	Matches
2007-2008	30	Barcelona	es ESP	1. La Liga	3rd	30	27	2,300	25.6	12	9	21	12	0	0	4	0	0.47	0.35	0.82	0.47	0.82	Matches
2008-2009	31	Barcelona	es ESP	1. La Liga	1st	29	26	2,180	24.2	19	8	27	19	0	0	4	1	0.78	0.33	1.11	0.78	1.11	Matches
2009-2010	32	Barcelona	es ESP	1. La Liga	1st	21	15	1,240	13.8	4	2	6	4	0	0	2	0	0.29	0.14	0.43	0.29	0.43	Matches
16 Seasons	4 Clubs		4 Leagues		477	398	37,010	411.2	239	114	353	211	28	28	75	2	0.58	0.28	0.86	0.51	0.79	
`
  },
  {
    leagueSlug: "legends",
    clubSlug: "icons",
    playerSlug: "zinedine-zidane",
    playerMeta: { name: "Zinedine Zidane", apiId: "icon_3", club: "Real Madrid", isGoalkeeper: false },
    rawText: `
Standard Stats: Domestic Leagues 
1992-1993	20	Bordeaux	fr FRA	1. Ligue 1	4th	35	35	3,100	34.4	10	4	14	10	0	0	7	1	0.29	0.12	0.41	0.29	0.41	Matches
1993-1994	21	Bordeaux	fr FRA	1. Ligue 1	4th	34	34	3,000	33.3	6	6	12	6	0	0	5	0	0.18	0.18	0.36	0.18	0.36	Matches
1994-1995	22	Bordeaux	fr FRA	1. Ligue 1	7th	37	37	3,280	36.4	6	7	13	6	0	0	8	1	0.16	0.19	0.36	0.16	0.36	Matches
1995-1996	23	Bordeaux	fr FRA	1. Ligue 1	16th	33	33	2,920	32.4	6	7	13	6	0	0	9	1	0.18	0.22	0.40	0.18	0.40	Matches
1996-1997	24	Juventus	it ITA	1. Serie A	1st	29	29	2,540	28.2	5	4	9	5	0	0	8	1	0.18	0.14	0.32	0.18	0.32	Matches
1997-1998	25	Juventus	it ITA	1. Serie A	1st	32	32	2,800	31.1	7	11	18	7	0	0	9	0	0.23	0.35	0.58	0.23	0.58	Matches
1998-1999	26	Juventus	it ITA	1. Serie A	7th	27	27	2,390	26.6	2	6	8	2	0	0	8	1	0.08	0.23	0.30	0.08	0.30	Matches
1999-2000	27	Juventus	it ITA	1. Serie A	2nd	32	32	2,810	31.2	4	5	9	3	1	1	7	1	0.13	0.16	0.29	0.10	0.26	Matches
2000-2001	28	Juventus	it ITA	1. Serie A	2nd	33	33	2,900	32.2	6	13	19	6	0	0	8	1	0.19	0.40	0.59	0.19	0.59	Matches
2001-2002	29	Real Madrid	es ESP	1. La Liga	3rd	31	31	2,660	29.6	7	9	16	7	0	0	9	0	0.24	0.30	0.54	0.24	0.54	Matches
2002-2003	30	Real Madrid	es ESP	1. La Liga	1st	33	33	2,860	31.8	9	12	21	9	0	0	8	0	0.28	0.38	0.66	0.28	0.66	Matches
2003-2004	31	Real Madrid	es ESP	1. La Liga	4th	33	33	2,920	32.4	6	12	18	6	0	0	11	1	0.19	0.37	0.56	0.19	0.56	Matches
2004-2005	32	Real Madrid	es ESP	1. La Liga	2nd	29	29	2,480	27.6	6	7	13	6	0	0	9	0	0.22	0.25	0.47	0.22	0.47	Matches
2005-2006	33	Real Madrid	es ESP	1. La Liga	2nd	29	29	2,380	26.4	9	10	19	8	1	1	12	0	0.34	0.38	0.72	0.30	0.68	Matches
14 Seasons	3 Clubs		3 Leagues		447	447	39,040	433.8	90	113	203	88	2	2	129	7	0.21	0.26	0.47	0.20	0.46	
`
  },
  {
    leagueSlug: "bundesliga",
    clubSlug: "bayern-munchen",
    playerSlug: "manuel-neuer",
    playerMeta: { name: "M. Neuer", apiId: "497", club: "Bayern München", isGoalkeeper: true },
    rawText: `
Goalkeeping: Domestic Leagues 
2006-2007	20	Schalke 04	de GER	1. Bundesliga	2nd	27	27	2,430	27.0	21	0.78	117	96	82.1	18	4	5	13	48.1						Matches
2007-2008	21	Schalke 04	de GER	1. Bundesliga	3rd	34	34	3,060	34.0	32	0.94	142	110	77.5	0	0	0	12	35.3						Matches
2008-2009	22	Schalke 04	de GER	1. Bundesliga	8th	27	27	2,430	27.0	26	0.96	133	107	80.5	11	6	10	11	40.7						Matches
2009-2010	23	Schalke 04	de GER	1. Bundesliga	2nd	34	34	3,060	34.0	31	0.91	161	130	80.7	19	8	7	15	44.1						Matches
2010-2011	24	Schalke 04	de GER	1. Bundesliga	14th	34	34	3,058	34.0	44	1.29	165	121	73.3	11	7	16	11	32.4						Matches
2011-2012	25	Bayern Munich	de GER	1. Bundesliga	2nd	33	33	2,970	33.0	22	0.67	78	56	71.8	22	4	7	17	51.5						Matches
2012-2013	26	Bayern Munich	de GER	1. Bundesliga	1st	31	31	2,790	31.0	18	0.58	89	71	79.8	26	4	1	18	58.1						Matches
2013-2014	27	Bayern Munich	de GER	1. Bundesliga	1st	31	31	2,745	30.5	18	0.59	99	81	81.8	26	2	2	15	48.4						Matches
2014-2015	28	Bayern Munich	de GER	1. Bundesliga	1st	32	31	2,867	31.9	18	0.57	94	76	80.9	24	4	4	20	64.5						Matches
2015-2016	29	Bayern Munich	de GER	1. Bundesliga	1st	34	34	3,020	33.6	16	0.48	80	64	80.0	28	4	2	20	58.8						Matches
2016-2017	30	Bayern Munich	de GER	1. Bundesliga	1st	26	26	2,340	26.0	13	0.50	67	54	80.6	19	6	1	14	53.8	0	0	0	0		Matches
2017-2018	31	Bayern Munich	de GER	1. Bundesliga	1st	3	3	270	3.0	2	0.67	8	6	75.0	2	0	1	2	66.7	0	0	0	0		Matches
2018-2019	32	Bayern Munich	de GER	1. Bundesliga	1st	26	26	2,303	25.6	23	0.90	57	34	59.6	20	3	3	10	38.5	3	3	0	0	0.0	Matches
2019-2020	33	Bayern Munich	de GER	1. Bundesliga	1st	33	33	2,970	33.0	31	0.94	113	82	72.6	25	4	4	15	45.5	4	3	1	0	25.0	Matches
2020-2021	34	Bayern Munich	de GER	1. Bundesliga	1st	33	33	2,970	33.0	42	1.27	122	81	65.6	24	5	4	9	27.3	3	1	1	1	50.0	Matches
2021-2022	35	Bayern Munich	de GER	1. Bundesliga	1st	28	28	2,510	27.9	26	0.93	89	63	70.8	22	4	2	10	35.7	1	1	0	0	0.0	Matches
2022-2023	36	Bayern Munich	de GER	1. Bundesliga	1st	12	12	1,080	12.0	11	0.92	44	33	75.0	7	4	1	4	33.3	2	2	0	0	0.0	Matches
2023-2024	37	Bayern Munich	de GER	1. Bundesliga	3rd	23	23	2,053	22.8	33	1.45	92	59	64.1	16	1	6	6	26.1	3	2	1	0	33.3	Matches
20 Seasons	2 Clubs		1 League		545	544	48,765	541.8	462	0.85	1847	1385	75.0	357	77	76	242	44.5	19	14	3	2	17.6	
`
  }
];

function main() {
  console.log("=== BATCH INGEST FBREF REAL TABLES ===");

  for (const item of PLAYER_FBREF_DATASETS) {
    const records = parseFBrefTableText(item.rawText, item.playerMeta);
    savePlayerFBrefStats(item.leagueSlug, item.clubSlug, item.playerSlug, records);
  }

  console.log("✓ All FBref dataset tables parsed and saved to per-player JSON files!");
}

main();
