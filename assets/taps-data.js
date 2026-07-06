// Local copy of the tap list, as plain text (same shape as assets/taps.csv).
// Loaded as a normal <script> tag so it works from a double-clicked file with
// no server. taps.js uses this UNLESS a live Google Sheet URL is configured
// in taps.js -- once that's set, the site fetches the real thing instead and
// this file just sits here unused as the offline fallback.
//
// Updated 2026-07-04 from Alex's actual printed menu. Note: the sour
// (Currant Capitulation) is already known to be out of date on the physical
// sheet -- Alex will correct it himself via Site Options.
window.TAPS_CSV_LOCAL = `tap,beer,brewery,style,abv,active
1,La Chulita,Alpha Acid Brewing Company,Mexican Lager,4.6,yes
2,Arnebräu,Rockaway Beach Brewery,Helles Lager,4.9,yes
3,Hop Dogma Pils,Hop Dogma Brewing Co.,German-Style Pilsner,5.2,yes
4,East Bay Nights,Oakland United Beerworks,Schwarzbier,5.2,yes
5,Currant Capitulation,Original Pattern Brewing,Fruited Sour,5.5,yes
6,Mavericks,Half Moon Bay Brewing Company,Amber Ale,5.8,yes
7,Hoppin' Around The World,Barebottle Brewing Company,Hazy IPA,6.6,yes
8,Willy-Nilly,Original Pattern Brewing,Hazy IPA,6.8,yes
9,Alpha Dankopotomus,Hop Dogma Brewing Co.,West Coast IPA,6.9,yes
10,Wandercrust,Ghost Town Brewing x Breakside Brewery,West Coast IPA,7.1,yes
11,,,,,no
12,,,,,no
13,,,,,no
`;
