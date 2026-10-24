// Seed list, chosen 2026-10-24. "leaderboard": top of data-api /v1/leaderboard?category=SPORTS&timePeriod=MONTH&orderBy=PNL
// (top 100 scanned) with at least 10 distinct game markets bought as taker in the last 7 days, mostly in leagues of
// POLYMARKET_LEAGUES. "research": trackability 4 or 5 in research/cappers/public-cappers.csv. Market makers and
// arbitrage bots from the research stay listed but disabled: per fill grading of quotes is not a pick record.
export type PolymarketTrader = {
  wallet: string;
  name: string;
  reason: string;
  enabled: boolean;
};

export const POLYMARKET_TRADERS: PolymarketTrader[] = [
  {
    wallet: "0xf0318c32136c2db7fec88b84869aee6a1106c80c",
    name: "BreakTheBank",
    reason: "leaderboard #1 (+$7.69M month); research 5",
    enabled: true,
  },
  {
    wallet: "0xcdcccd0f2d86e450d973da415ad2430e5cc7935a",
    name: "joseph00677",
    reason: "leaderboard #2 (+$7.27M month); research 5",
    enabled: true,
  },
  {
    wallet: "0x5268527977f700f9bf9b6d5cd843859e4e70135d",
    name: "HomeRunHazard",
    reason: "leaderboard #3 (+$1.95M month); research 4",
    enabled: true,
  },
  {
    wallet: "0x1f3a646ce5cbe2c70270e7a46161d89b7c7b895d",
    name: "mooseborzoii",
    reason: "leaderboard #4 (+$1.81M month), NBA and CFB",
    enabled: true,
  },
  {
    wallet: "0x361b16e3ddfe1d415d41008daac2631d94ab74fe",
    name: "RichieRicher",
    reason: "leaderboard #7 (+$1.25M month), EPL, UCL, LaLiga",
    enabled: true,
  },
  {
    wallet: "0x924379a79c64b77ad5816ad362122a5f6228658e",
    name: "Kch-Temp",
    reason: "leaderboard #9 (+$900K month), CFB and NFL",
    enabled: true,
  },
  {
    wallet: "0x2a69660046d7acc4ab204d7cc5ba78b0776cd2f7",
    name: "UpTheBlues",
    reason: "leaderboard #10 (+$860K month), Brasileirao; off: about 199k trades exceed the data API page cap, so its history would be partial",
    enabled: false,
  },
  {
    wallet: "0x83720820a8aa6c3f20ad71850e7a1a17d16c5223",
    name: "Jsram",
    reason: "leaderboard #11 (+$719K month), EPL and UCL",
    enabled: true,
  },
  {
    wallet: "0xd38b71f3e8ed1af71983e5c309eac3dfa9b35029",
    name: "primm",
    reason: "leaderboard #12 (+$681K month), CFB and NFL",
    enabled: true,
  },
  {
    wallet: "0xe221be3b45dfe5ed562ee9dc16f47205728e06f6",
    name: "Jokerxing7",
    reason: "leaderboard #13 (+$668K month), NBA and UCL",
    enabled: true,
  },
  {
    wallet: "0xbc43c8bfbc4d77c2fc9011adad38ba43b88996d3",
    name: "0xbc43c8bf",
    reason: "leaderboard #14 (+$646K month), ATP, WTA, NFL",
    enabled: true,
  },
  {
    wallet: "0xa38a455bbdd4b68486548b7e19da99903f4f821d",
    name: "takeormake",
    reason: "leaderboard #15 (+$594K month), NBA",
    enabled: true,
  },
  {
    wallet: "0x9b11866433281ade9f2811dbde8acdefc45f5375",
    name: "0x9b118664",
    reason: "leaderboard #17 (+$552K month), NFL",
    enabled: true,
  },
  {
    wallet: "0x7ad71d79a3bb90d0a87a06500fa0fe11663842aa",
    name: "theowalcott",
    reason: "leaderboard #18 (+$525K month), MLS and Liga MX",
    enabled: true,
  },
  {
    wallet: "0xe7870d0e1bfc65a23e3d66caf00ca1b9129e5034",
    name: "Kkunn",
    reason: "leaderboard #19 (+$495K month), WTA and ATP",
    enabled: true,
  },
  {
    wallet: "0xb4f978be63cdf75554b0b46a4262a6db597cc9a7",
    name: "0xb4f978be",
    reason: "leaderboard #20 (+$436K month), CFB, NFL, NBA",
    enabled: true,
  },
  {
    wallet: "0x27f738fe203827445690339104aae35b20bc44b0",
    name: "ic4cream",
    reason: "leaderboard #21 (+$405K month), NBA and CFB",
    enabled: true,
  },
  {
    wallet: "0x0d6a1ada6d7ff785ab4b7263d9ce8e2baa85aa98",
    name: "keeptheblueflagflyinghigh",
    reason: "leaderboard #22 (+$399K month), NBA",
    enabled: true,
  },
  {
    wallet: "0xe18ecc345e00ee7c4f2d1f676f3dd2acb112f826",
    name: "ArielFilipino",
    reason: "leaderboard #23 (+$361K month), CFB and NBA",
    enabled: true,
  },
  {
    wallet: "0x7e3a1f95c558f39a51ff334d789e3e039b553246",
    name: "KaneAnalytics",
    reason: "leaderboard #24 (+$351K month), CFB and NFL; research 5",
    enabled: true,
  },
  {
    wallet: "0x10a6fadcbacd66330862206f6199b197e3ad4d8b",
    name: "rabbitfoot1",
    reason: "leaderboard #28 (+$304K month), UCL, Serie A, Bundesliga",
    enabled: true,
  },
  {
    wallet: "0xf68a281980f8c13828e84e147e3822381d6e5b1b",
    name: "Nooserac",
    reason: "leaderboard #34 (+$243K month), NBA, NFL, CFB; research 5",
    enabled: true,
  },
  {
    wallet: "0xbca08c1bc204a34f2fddbe47b438b9bd42ac9705",
    name: "justaluckydude",
    reason: "leaderboard #38 (+$214K month), NBA and CFB",
    enabled: true,
  },
  {
    wallet: "0x6a72f61820b26b1fe4d956e17b6dc2a1ea3033ee",
    name: "kch123",
    reason: "research 5, sports PnL +$11.45M all time; idle since 2026-06",
    enabled: true,
  },
  {
    wallet: "0xc2e7800b5af46e6093872b177b7a5e7f0563be51",
    name: "beachboy4",
    reason: "research 5, sports PnL +$5.83M all time, MLS and tennis",
    enabled: true,
  },
  {
    wallet: "0x84dbb7103982e3617704a2ed7d5b39691952aeeb",
    name: "Soarin22",
    reason: "research 5, sports PnL +$1.52M all time, NBA",
    enabled: true,
  },
  {
    wallet: "0xfbf3d501e88815464642d0e913f15379c3eeb218",
    name: "VPenguin",
    reason: "research 5, sports PnL +$1.24M all time, NBA and UFC",
    enabled: true,
  },
  {
    wallet: "0x204f72f35326db932158cba6adff0b9a1da95e14",
    name: "swisstony",
    reason: "research 4; disabled: market maker, 150k+ tiny positions",
    enabled: false,
  },
  {
    wallet: "0x2005d16a84ceefa912d4e380cd32e7ff827875ea",
    name: "RN1",
    reason: "research 4; disabled: arbitrage and HFT",
    enabled: false,
  },
  {
    wallet: "0xe90bec87d9ef430f27f9dcfe72c34b76967d5da2",
    name: "gmanas",
    reason: "research 4; disabled: high frequency, inactive since 2026-03",
    enabled: false,
  },
];
