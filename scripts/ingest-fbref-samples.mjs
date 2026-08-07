import { parseFBrefTableText, savePlayerFBrefStats } from "./fbref-parser.mjs";

const kluivertRawText = `
Standard Stats: Domestic Leagues 
1997-1998	21	Milan	it ITA	1. Serie A	10th	27	26	2,093	23.3	6	0	6	6	0	0	4	0	0.26	0.00	0.26	0.26	0.26	Matches
1998-1999	22	Barcelona	es ESP	1. La Liga	1st	35	35	2,885	32.1	14	0	14	14	0	0	8	0	0.44	0.00	0.44	0.44	0.44	Matches
1999-2000	23	Barcelona	es ESP	1. La Liga	2nd	26	24	2,051	22.8	16	10	26	14	2	2	6	1	0.70	0.44	1.14	0.61	1.05	Matches
2000-2001	24	Barcelona	es ESP	1. La Liga	4th	31	30	2,566	28.5	17	6	23	17	0	0	5	0	0.60	0.21	0.81	0.60	0.81	Matches
2001-2002	25	Barcelona	es ESP	1. La Liga	4th	33	33	2,761	30.7	18	6	24	15	3	3	4	1	0.59	0.20	0.78	0.49	0.68	Matches
2002-2003	26	Barcelona	es ESP	1. La Liga	6th	36	36	3,133	34.8	16	7	23	15	1	1	6	1	0.46	0.20	0.66	0.43	0.63	Matches
2003-2004	27	Barcelona	es ESP	1. La Liga	2nd	21	11	1,287	14.3	8	2	10	8	0	0	2	0	0.56	0.14	0.70	0.56	0.70	Matches
2004-2005	28	Newcastle	eng ENG	1. Premier League	14th	25	15	1,292	14.4	6	1	7	6	0	0	3	0	0.42	0.07	0.49	0.42	0.49	Matches
2005-2006	29	Valencia	es ESP	1. La Liga	3rd	10	1	209	2.3	1	1	2	1	0	0	2	0	0.43	0.43	0.86	0.43	0.86	Matches
2006-2007	30	PSV	nl NED	1. Eredivisie	1st	16	5	541	6.0	3	3	6	3	0	0	0	0	0.50	0.50	1.00	0.50	1.00	Matches
2007-2008	31	Lille	fr FRA	1. Ligue 1	7th	13	8	592	6.6	4	0	4	2	2	2	0	0	0.61	0.00	0.61	0.30	0.30	Matches
11 Seasons	6 Clubs		5 Leagues		273	224	19,410	215.7	109	36	125	101	8	8	40	3	0.51	0.22	0.78	0.47	0.73	
Barcelona (6 Seasons)		1 League		182	169	14,683	163.1	89	31	106	83	6	6	31	3	0.55	0.24	0.81	0.51	0.76	
Milan (1 Season)		1 League		27	26	2,093	23.3	6	0	6	6	0	0	4	0	0.26	0.00	0.26	0.26	0.26	
Newcastle (1 Season)		1 League		25	15	1,292	14.4	6	1	7	6	0	0	3	0	0.42	0.07	0.49	0.42	0.49	
PSV (1 Season)		1 League		16	5	541	6.0	3	3	6	3	0	0	0	0	0.50	0.50	1.00	0.50	1.00	
Lille (1 Season)		1 League		13	8	592	6.6	4	0	4	2	2	2	0	0	0.61	0.00	0.61	0.30	0.30	
Valencia (1 Season)		1 League		10	1	209	2.3	1	1	2	1	0	0	2	0	0.43	0.43	0.86	0.43	0.86	
`;

const neuerRawText = `
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
2024-2025	38	Bayern Munich	de GER	1. Bundesliga	1st	22	22	1,980	22.0	15	0.68	46	30	67.4	18	4	0	13	59.1	2	1	0	1	0.0	Matches
2025-2026	39	Bayern Munich	de GER	1. Bundesliga	1st	22	22	1,859	20.7	20	0.97	51	31	60.8	19	3	0	7	31.8	1	1	0	0	0.0	Matches
20 Seasons	2 Clubs		1 League		545	544	48,765	541.8	462	0.85	1847	1385	75.0	357	77	76	242	44.5	19	14	3	2	17.6	
`;

function main() {
  console.log("Parsing sample FBref tables...");

  const kluivertRecords = parseFBrefTableText(kluivertRawText, {
    name: "Patrick Kluivert",
    apiId: "kluivert_icon",
    club: "Barcelona",
    isGoalkeeper: false,
  });
  savePlayerFBrefStats("legends", "icons", "patrick-kluivert", kluivertRecords);

  const neuerRecords = parseFBrefTableText(neuerRawText, {
    name: "Manuel Neuer",
    apiId: "neuer_active",
    club: "Bayern Munich",
    isGoalkeeper: true,
  });
  savePlayerFBrefStats("bundesliga", "bayern-munchen", "manuel-neuer", neuerRecords);

  console.log("✓ Successfully parsed and saved sample FBref per-player JSON files!");
}

main();
