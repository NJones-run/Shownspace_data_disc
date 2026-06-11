import type { CaptureGame, CapturePlayer, CaptureState } from "./types";

export const demoGame: CaptureGame = {
  GameID: "2026-demo-NY-SLC",
  HomeTeamID: "shred",
  AwayTeamID: "empire",
  HomeScore: 0,
  AwayScore: 0,
  Status: "Demo",
  Year: 2026
};

export const demoPlayers: CapturePlayer[] = [
  { PlayerID: "empire-axel-agami", TeamID: "empire", Year: 2026, FirstName: "Axel", LastName: "Agami", JerseyNumber: "18" },
  { PlayerID: "empire-alex-atkins", TeamID: "empire", Year: 2026, FirstName: "Alex", LastName: "Atkins", JerseyNumber: "0" },
  { PlayerID: "empire-arthur-aucoin", TeamID: "empire", Year: 2026, FirstName: "Arthur", LastName: "Aucoin", JerseyNumber: "22" },
  { PlayerID: "empire-luke-barry", TeamID: "empire", Year: 2026, FirstName: "Luke", LastName: "Barry", JerseyNumber: "16" },
  { PlayerID: "empire-eliot-bemis", TeamID: "empire", Year: 2026, FirstName: "Eliot", LastName: "Bemis", JerseyNumber: "19" },
  { PlayerID: "empire-marques-brownlee", TeamID: "empire", Year: 2026, FirstName: "Marques", LastName: "Brownlee", JerseyNumber: "82" },
  { PlayerID: "empire-oliver-chartock", TeamID: "empire", Year: 2026, FirstName: "Oliver", LastName: "Chartock", JerseyNumber: "13" },
  { PlayerID: "empire-eamon-conneely", TeamID: "empire", Year: 2026, FirstName: "Eamon", LastName: "Conneely", JerseyNumber: "99" },
  { PlayerID: "empire-jacob-cowan", TeamID: "empire", Year: 2026, FirstName: "Jacob", LastName: "Cowan", JerseyNumber: "24" },
  { PlayerID: "empire-antoine-davis", TeamID: "empire", Year: 2026, FirstName: "Antoine", LastName: "Davis", JerseyNumber: "81" },
  { PlayerID: "empire-alex-davis-3", TeamID: "empire", Year: 2026, FirstName: "Alex", LastName: "Davis", JerseyNumber: "80" },
  { PlayerID: "empire-daan-de-marree", TeamID: "empire", Year: 2026, FirstName: "Daan", LastName: "De Marrée", JerseyNumber: "27" },
  { PlayerID: "empire-braden-eberhard", TeamID: "empire", Year: 2026, FirstName: "Braden", LastName: "Eberhard", JerseyNumber: "20" },
  { PlayerID: "empire-robert-elston", TeamID: "empire", Year: 2026, FirstName: "Robert", LastName: "Elston", JerseyNumber: "57" },
  { PlayerID: "empire-oliver-fay", TeamID: "empire", Year: 2026, FirstName: "Oliver", LastName: "Fay", JerseyNumber: "41" },
  { PlayerID: "empire-liam-haberfield", TeamID: "empire", Year: 2026, FirstName: "Liam", LastName: "Haberfield", JerseyNumber: "37" },
  { PlayerID: "empire-ben-jagt", TeamID: "empire", Year: 2026, FirstName: "Ben", LastName: "Jagt", JerseyNumber: "4" },
  { PlayerID: "empire-sam-jonas", TeamID: "empire", Year: 2026, FirstName: "Sam", LastName: "Jonas", JerseyNumber: "12" },
  { PlayerID: "empire-matt-labar", TeamID: "empire", Year: 2026, FirstName: "Matt", LastName: "LaBar", JerseyNumber: "2" },
  { PlayerID: "empire-ethan-lieman", TeamID: "empire", Year: 2026, FirstName: "Ethan", LastName: "Lieman", JerseyNumber: "14" },
  { PlayerID: "empire-gavin-may", TeamID: "empire", Year: 2026, FirstName: "Gavin", LastName: "May", JerseyNumber: "32" },
  { PlayerID: "empire-samuel-mccrory", TeamID: "empire", Year: 2026, FirstName: "Samuel", LastName: "McCrory", JerseyNumber: "8" },
  { PlayerID: "empire-elliott-moore", TeamID: "empire", Year: 2026, FirstName: "Elliott", LastName: "Moore", JerseyNumber: "21" },
  { PlayerID: "empire-tej-murthy", TeamID: "empire", Year: 2026, FirstName: "Tej", LastName: "Murthy", JerseyNumber: "10" },
  { PlayerID: "empire-caoba-nichim-luta", TeamID: "empire", Year: 2026, FirstName: "Caoba", LastName: "Nichim-Luta", JerseyNumber: "1" },
  { PlayerID: "empire-charlie-panarella", TeamID: "empire", Year: 2026, FirstName: "Charlie", LastName: "Panarella", JerseyNumber: "30" },
  { PlayerID: "empire-james-pardo", TeamID: "empire", Year: 2026, FirstName: "James", LastName: "Pardo", JerseyNumber: "40" },
  { PlayerID: "empire-john-randolph", TeamID: "empire", Year: 2026, FirstName: "John", LastName: "Randolph", JerseyNumber: "34" },
  { PlayerID: "empire-andres-rodriguez", TeamID: "empire", Year: 2026, FirstName: "Andres", LastName: "Rodriguez", JerseyNumber: "95" },
  { PlayerID: "empire-solomon-rueschemeyer-bailey", TeamID: "empire", Year: 2026, FirstName: "Solomon", LastName: "Rueschemeyer-Bailey", JerseyNumber: "9" },
  { PlayerID: "empire-drew-schnaudigel", TeamID: "empire", Year: 2026, FirstName: "Drew", LastName: "Schnaudigel", JerseyNumber: "25" },
  { PlayerID: "empire-kai-schniedergers", TeamID: "empire", Year: 2026, FirstName: "Kai", LastName: "Schniedergers", JerseyNumber: "58" },
  { PlayerID: "empire-everest-shapiro", TeamID: "empire", Year: 2026, FirstName: "Everest", LastName: "Shapiro", JerseyNumber: "23" },
  { PlayerID: "empire-benjamin-simmons", TeamID: "empire", Year: 2026, FirstName: "Benjamin", LastName: "Simmons", JerseyNumber: "5" },
  { PlayerID: "empire-nicholas-whitlock", TeamID: "empire", Year: 2026, FirstName: "Nicholas", LastName: "Whitlock", JerseyNumber: "7" },
  { PlayerID: "empire-jack-williams", TeamID: "empire", Year: 2026, FirstName: "Jack", LastName: "Williams", JerseyNumber: "11" },
  { PlayerID: "empire-wes-yan", TeamID: "empire", Year: 2026, FirstName: "Wes", LastName: "Yan", JerseyNumber: "28" },
  { PlayerID: "shred-carson-armstrong", TeamID: "shred", Year: 2026, FirstName: "Carson", LastName: "Armstrong", JerseyNumber: "5" },
  { PlayerID: "shred-ben-ashton", TeamID: "shred", Year: 2026, FirstName: "Ben", LastName: "Ashton", JerseyNumber: "12" },
  { PlayerID: "shred-oscar-brown", TeamID: "shred", Year: 2026, FirstName: "Oscar", LastName: "Brown", JerseyNumber: "11" },
  { PlayerID: "shred-reed-browning", TeamID: "shred", Year: 2026, FirstName: "Reed", LastName: "Browning", JerseyNumber: "33" },
  { PlayerID: "shred-koven-card", TeamID: "shred", Year: 2026, FirstName: "Koven", LastName: "Card", JerseyNumber: "44" },
  { PlayerID: "shred-simon-dastrup", TeamID: "shred", Year: 2026, FirstName: "Simon", LastName: "Dastrup", JerseyNumber: "61" },
  { PlayerID: "shred-jace-duennebeil", TeamID: "shred", Year: 2026, FirstName: "Jace", LastName: "Duennebeil", JerseyNumber: "22" },
  { PlayerID: "shred-alex-forsberg", TeamID: "shred", Year: 2026, FirstName: "Alex", LastName: "Forsberg", JerseyNumber: "25" },
  { PlayerID: "shred-matthew-fredrickson", TeamID: "shred", Year: 2026, FirstName: "Matthew", LastName: "Fredrickson", JerseyNumber: "16" },
  { PlayerID: "shred-kaden-froebe", TeamID: "shred", Year: 2026, FirstName: "Kaden", LastName: "Froebe", JerseyNumber: "26" },
  { PlayerID: "shred-jonny-hoffman", TeamID: "shred", Year: 2026, FirstName: "Jonny", LastName: "Hoffman", JerseyNumber: "24" },
  { PlayerID: "shred-jacob-hoffman", TeamID: "shred", Year: 2026, FirstName: "Jacob", LastName: "Hoffman", JerseyNumber: "27" },
  { PlayerID: "shred-ben-hoffman", TeamID: "shred", Year: 2026, FirstName: "Ben", LastName: "Hoffman", JerseyNumber: "21" },
  { PlayerID: "shred-jordan-kerr", TeamID: "shred", Year: 2026, FirstName: "Jordan", LastName: "Kerr", JerseyNumber: "66" },
  { PlayerID: "shred-derik-knighton", TeamID: "shred", Year: 2026, FirstName: "Derik", LastName: "Knighton", JerseyNumber: "32" },
  { PlayerID: "shred-eugene-lheureux", TeamID: "shred", Year: 2026, FirstName: "Eugene", LastName: "L'Heureux", JerseyNumber: "89" },
  { PlayerID: "shred-aj-macisaac", TeamID: "shred", Year: 2026, FirstName: "AJ", LastName: "MacIsaac", JerseyNumber: "93" },
  { PlayerID: "shred-joe-merrill", TeamID: "shred", Year: 2026, FirstName: "Joe", LastName: "Merrill", JerseyNumber: "40" },
  { PlayerID: "shred-jacob-miller", TeamID: "shred", Year: 2026, FirstName: "Jacob", LastName: "Miller", JerseyNumber: "0" },
  { PlayerID: "shred-merick-moar", TeamID: "shred", Year: 2026, FirstName: "Merick", LastName: "Moar", JerseyNumber: "23" },
  { PlayerID: "shred-tony-mounga", TeamID: "shred", Year: 2026, FirstName: "Tony", LastName: "Mounga", JerseyNumber: "7" },
  { PlayerID: "shred-porter-oyler", TeamID: "shred", Year: 2026, FirstName: "Porter", LastName: "Oyler", JerseyNumber: "17" },
  { PlayerID: "shred-sam-pew", TeamID: "shred", Year: 2026, FirstName: "Sam", LastName: "Pew", JerseyNumber: "4" },
  { PlayerID: "shred-kimball-pew", TeamID: "shred", Year: 2026, FirstName: "Kimball", LastName: "Pew", JerseyNumber: "15" },
  { PlayerID: "shred-lucas-reavy", TeamID: "shred", Year: 2026, FirstName: "Lucas", LastName: "Reavy", JerseyNumber: "20" },
  { PlayerID: "shred-grayson-rettberg", TeamID: "shred", Year: 2026, FirstName: "Grayson", LastName: "Rettberg", JerseyNumber: "99" },
  { PlayerID: "shred-grayson-rettburg", TeamID: "shred", Year: 2026, FirstName: "Grayson", LastName: "Rettburg", JerseyNumber: "99" },
  { PlayerID: "shred-matt-russnogle", TeamID: "shred", Year: 2026, FirstName: "Matt", LastName: "Russnogle", JerseyNumber: "18" },
  { PlayerID: "shred-everett-saunders", TeamID: "shred", Year: 2026, FirstName: "Everett", LastName: "Saunders", JerseyNumber: "29" },
  { PlayerID: "shred-jared-scheinberg", TeamID: "shred", Year: 2026, FirstName: "Jared", LastName: "Scheinberg", JerseyNumber: "3" },
  { PlayerID: "shred-karl-staber", TeamID: "shred", Year: 2026, FirstName: "Karl", LastName: "Staber", JerseyNumber: "36" },
  { PlayerID: "shred-cole-stenseth", TeamID: "shred", Year: 2026, FirstName: "Cole", LastName: "Stenseth", JerseyNumber: "9" },
  { PlayerID: "shred-porter-stobbe", TeamID: "shred", Year: 2026, FirstName: "Porter", LastName: "Stobbe", JerseyNumber: "1" },
  { PlayerID: "shred-jared-waite", TeamID: "shred", Year: 2026, FirstName: "Jared", LastName: "Waite", JerseyNumber: "95" },
  { PlayerID: "shred-curtis-watkins", TeamID: "shred", Year: 2026, FirstName: "Curtis", LastName: "Watkins", JerseyNumber: "19" },
  { PlayerID: "shred-kyle-weinberg", TeamID: "shred", Year: 2026, FirstName: "Kyle", LastName: "Weinberg", JerseyNumber: "34" },
  { PlayerID: "shred-ethan-wimmer", TeamID: "shred", Year: 2026, FirstName: "Ethan", LastName: "Wimmer", JerseyNumber: "13" },
  { PlayerID: "shred-chad-yorgason", TeamID: "shred", Year: 2026, FirstName: "Chad", LastName: "Yorgason", JerseyNumber: "6" },
  { PlayerID: "shred-luke-yorgason", TeamID: "shred", Year: 2026, FirstName: "Luke", LastName: "Yorgason", JerseyNumber: "2" },
  { PlayerID: "shred-mckay-yorgason", TeamID: "shred", Year: 2026, FirstName: "McKay", LastName: "Yorgason", JerseyNumber: "10" }
];

export const demoLinePresets = [
  {
    id: "empire-offense",
    label: "Empire O-line",
    playerIds: [
      "empire-alex-atkins",
      "empire-matt-labar",
      "empire-jack-williams",
      "empire-ben-jagt",
      "empire-jacob-cowan",
      "empire-john-randolph",
      "empire-oliver-chartock"
    ]
  },
  {
    id: "shred-offense",
    label: "Shred O-line",
    playerIds: [
      "shred-jordan-kerr",
      "shred-chad-yorgason",
      "shred-mckay-yorgason",
      "shred-ben-ashton",
      "shred-jace-duennebeil",
      "shred-tony-mounga",
      "shred-simon-dastrup"
    ]
  },
  {
    id: "sample-matchup",
    label: "Sample matchup",
    playerIds: ["empire-alex-atkins", "empire-jack-williams", "shred-jordan-kerr", "shred-ben-ashton"]
  }
];

export function createCaptureState(game: CaptureGame, players: CapturePlayer[] = []): CaptureState {
  const now = new Date().toISOString();
  return {
    game,
    session: {
      sessionId: `session-${game.GameID}`,
      gameId: game.GameID,
      deviceId: "local-device",
      scorerName: "Demo Scorer",
      createdAt: now,
      updatedAt: now,
      syncStatus: "local"
    },
    players,
    events: [],
    possessionTeamSide: "home",
    quarter: 1,
    pointNumber: 1,
    possessionNumber: 1
  };
}

function slugifyTeamName(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function createCustomGame(awayTeam: string, homeTeam: string): CaptureGame {
  const away = awayTeam.trim() || "Away";
  const home = homeTeam.trim() || "Home";
  return {
    GameID: `custom-${slugifyTeamName(away, "away")}-at-${slugifyTeamName(home, "home")}`,
    HomeTeamID: home,
    AwayTeamID: away,
    HomeScore: 0,
    AwayScore: 0,
    Status: "Custom",
    Year: 2026
  };
}

export function createCustomState(awayTeam: string, homeTeam: string): CaptureState {
  return createCaptureState(createCustomGame(awayTeam, homeTeam), []);
}

export function createDemoState(): CaptureState {
  return createCaptureState(demoGame, demoPlayers);
}
