import React from 'react';
// import { render, screen } from '@testing-library/react';
import { RaidState } from './raidcalc/RaidState';
import { RaidBattle, RaidBattleInfo } from './raidcalc/RaidBattle';
import { BuildInfo } from './raidcalc/inputs';
import { LightBuildInfo } from './raidcalc/hashData';

import { lightToFullBuildInfo } from './uicomponents/LinkButton';
import { deserialize } from './utilities/shrinkstring';

import { TextEncoder, TextDecoder } from 'util';
import exp from 'constants';
Object.assign(global, { TextDecoder, TextEncoder });

// RaidCalc tests

async function resultsFromLightBuild(strategy: LightBuildInfo) {
  const info = await lightToFullBuildInfo(strategy);
  expect(info).not.toBeNull(); // check that the strategy has been loaded successfully
  const buildInfo = info as BuildInfo;
  const startingState = new RaidState(buildInfo.pokemon);
  const battleInfo: RaidBattleInfo = {
    name: buildInfo.name,
    notes: buildInfo.notes,
    credits: buildInfo.credits,
    startingState: startingState,
    groups: buildInfo.groups,
  }
  const battle = new RaidBattle(battleInfo);
  const result = battle.result();
  let totalTurns = strategy.turns.length; 
  if (strategy.repeats) {
    totalTurns = strategy.groups!.reduce((a, b, i) => b.length * (strategy.repeats![i] || 1) + a, 0);
  }
  expect(result.turnResults.length).toEqual(totalTurns); // this checks that the calc didn't encounter an error
  return result;
}

async function resultsFromHash(hash: string) {
  const obj = deserialize(hash);
  const result = await resultsFromLightBuild(obj);
  return result;
}

async function testOHKO(strategy: LightBuildInfo) {
  const result = await resultsFromLightBuild(strategy);
  expect(result.endState.raiders[0].originalCurHP).toEqual(0); // check for the OHKO
  // Some strategies include risk of fainting, so the following checks have beein omitted
  // // check that all raiders did not faint
  // for (let i=2; i<=4; i++) { // We'll i=1 as the convention for DPS, which will sometimes faint due to recoil
  //   expect(result.endState.raiders[i].originalCurHP).not.toEqual(0);
  // }
}

// Test cases for specific interactions
// these also ensure that URL hashes are not broken
describe('Specific Test Cases', () => {
  test('booster_instruct_symbiosis', async () => {
    const hash: string = "#H4sIAAAAAAAAA7WUW2/aMBSA/4rlp03KAyWwVX2pgDJKV1qtdE+IB5OcgBfHjnyhRRX/feeYQMtUadNURLAcn9t3Ls4LL/gFz345o3nCPb+YzVoJ16ICPk9oK/Nmk1npUcVBZnQu7GZYFJB5h0fWKEVKZwkPDuz4ijwJuwQft6b20mhHGu2EL60JNZ5WZg1jXRjcLoxzk/3rzo82Hsh1ZiGXMUhtSqh2kMFqOomeXEO3Ip/Cl7jmUBBnLeKaxxWa6IgKvMkP9RdSSb/BnfRQxXN0ThJYUwQZVwVrUBQXrHjc1NDAuz15UF7WSoIlu2dvxSRK5/OEr/nFC8eafkn4dHqTsrE1ml0LnZMxPj3nyWwWlc4TzONByJz10S1KH6RSYmEMkY2scG7DpgHLyhMdlEr4DdYd4aPxVzQ+/Obb/WF69seDorMWxrkzthKY1Yxf2VCxPggv9ZKQMmsW+JIRQd/kGFMJIrg1T+y7zEqsZNpFFzNkMk9+FdVMtQjW0Xz0gyrZzxrTbyDOE+znyJQBhUf5/wjCluzKyjXsfFAx2FCDXVJLermohPaH/Nrddvz/e46Xl5eU4EAZB2yAiCICAlaNUdaYCenN3qDiiDzaoEviu7dCL4Ml7ummWkjjJB3fygLYvV1EZpUf8bVeCf/OF5s442PtvA2Zf4cmpcJ5oKGfiOBWMRz/ZiXonI2wfPQ6wGmznmGWovwopmtQNY5DbBX6fMS2K3gHsIMtHd3dPwzZZBghl7IUlq7ipzvDervr9Xk/r9cI/J/zuuN6BZg3d6aLHYuy+NY5oGLpWruzNCmEctCsvJKao/n2YECgdGGRsoWT2thgR2C38Eo8R4u9TRe1jkIeGogs6cmCto6DvplidHC6XA91RPOe9yIr2WAF9NFqnzBq503U41lMXz18eNTucYmPvxunKDJOMYo6cxzo7W9OYO9BiQcAAA==";
    const build = await deserialize(hash);
    expect(build).not.toBeNull();
    await testOHKO(build as LightBuildInfo);
  })
  test('qp_activation', async () => {
    const hash: string = "#H4sIAAAAAAAAA8VUUU/bMBD+K5H3skme1NACXd/oAI1JbAx4q/Jgkkvw4trR2anIEP99ZyehTcue1m5KZJ3Pd9/35e7iZ5azGUt/WqMZZ47NFosRZ1osgSXcmzLrjBSloxALqdGZwOYizyF1llxolPJBMWe1Bbw690gCC3DBNJWTRlsfccRZgaauyLs0K7jSuSHzwVh73W9bHG0ceOgUIZOBpDIlLFuRNWrvCUi2U/foMYUrac0g9zorEdYsrNCxk1Rg3fdR/INU0jVkSQfL4CdwfwIrzyDDqmAFyvMCivumgk687ZXXyslKSUCf9+RQXIfTJOFsxWbPjGp6whnr3kVwTDlpvhUyi+YEQQe3UEhQUEqy338z0Vkr7QPjulaKsy8CMxIakk8p+fVJXnrnON566SgejVqARRLsRdLHT3ncKgCM3sXEeoVGR/NaZ6FCP2qBZXSOcuV3nx9NpSCaA6Kv1l+LYZcI8As+nge4s6Jtw67Eo7XEIwq8kTqtMX2UfgwuFI0fyjS6q2nU9lanNe49fa0gql1Z47WsMSn5jkIXNdZk3jXLB2ms9C2dG2NpZqILDVjsp2xz0lVGcwRRviFrspY1IbqvsihUU9V5vjNT7AacaMQeG3otrWteS8bZpZK62NCYdIN/zLuUsJu0wvwPQ6piOgvuMc+FstCtbOmb8NJLGeaMKOvNHPEUcvqsY5qlAe9mKamhf0DZC/N4yNyWhrp1SM6TLc6N/+2wZZ4MibfmYnJQ7uP/9dGnQ+L+Qjsw63TIunNx0cgfkv7Tv652Em6Sl98TYWNjswgAAA==";
    const result = await resultsFromHash(hash); 
    // T1 Electric terrain -> QP boost is spe, hasn't used booster
    expect(result.turnResults[0].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[0].state.raiders[1].boostedStat).toEqual("spe");
    expect(result.turnResults[0].state.raiders[1].usedBoosterEnergy).toEqual(undefined);
    // T2 Passed Booster Energy -> QP boost is spe, hasn't used booster yet
    expect(result.turnResults[1].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[1].state.raiders[1].boostedStat).toEqual("spe");
    expect(result.turnResults[1].state.raiders[1].usedBoosterEnergy).toEqual(undefined);
    expect(result.turnResults[1].state.raiders[1].item).toEqual("Booster Energy");
    // T5 Consume Booster Energy -> QP boost is spa, has used booster
    expect(result.turnResults[4].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[4].state.raiders[1].boostedStat).toEqual("spa");
    expect(result.turnResults[4].state.raiders[1].usedBoosterEnergy).toEqual(true);
    expect(result.turnResults[4].state.raiders[1].item).toEqual(undefined);
    // T8 Electric Terrain set -> QP boost is still spa, has used booster
    expect(result.turnResults[7].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[7].state.raiders[1].boostedStat).toEqual("spa");
    expect(result.turnResults[7].state.raiders[1].usedBoosterEnergy).toEqual(true);
    expect(result.turnResults[7].state.raiders[1].item).toEqual(undefined);
  })
  test('unburden', async () => {
    const hash = "#H4sIAAAAAAAAA8VS328TMQz+Vyo/MSkP7brB1LeVIm1IAzSGeDjdg3vn60JzySk/yqqp/ztOLsdaKAiEJnQny3Hs7/vs+BEamEH1xRkNAjzMimIsQGNLUIroyjo7lZWeUxxVRtdot2+ahirvOGSNUjFpIiA4steLiIR2RT65pvPSaBczTgWsrAkdR1uzoWvdGHaXxrmb4djjaOMpQleWaplIOrOmthcZrI6RhOSyuvuIiX7NtqYm6uww2TpZyuwslSD3x/lLqaTfsic9tSnO4PGGNpFBJqtoQyryksW7bUdZvBuUB+VlpyTZWPfgLd6k27IUsIHZI/BMXwqA/BcpcCFY8y3KejRnCL64lUrh0pio4sU7M7rspZ2A0EEpAW95xiw0Fb/i4u9fuRuC08kPP19NxuMeoIA7XNNoYb7GEX42ph5dYdsm0ZeVNUv0sopCFja0oznxUa94aBGgSIpiVydZ3e/9ctB0IfgpP2pCpxLRnvtJL4OtKYr5gFvskDmtjU8xt7ihv+p0fNjoXjtZ/54g3oH3FvUq2AAH7rGhX6Gt/23or41uguP1PyJlyq3LNVb3kf7JexYhP7Of/Rf2Mu//uch36XR2sEn8oH14KhpUjrKFVvIUdwPnYc2Yq47W4EOqGarOOe+A9+mBeDV+gfFnvN4G6s0R1tPn6vYoa5lmvfsGoT3UNtwFAAA=";
    const result = await resultsFromHash(hash);
    // T1 Rillaboom outspeeds, Unburden not activated
    expect(result.turnResults[0].results[0].userID).toEqual(0); // Rillaboom moves first
    expect(result.turnResults[0].results[1].userID).toEqual(1); // Sneasler moves second
    expect(result.turnResults[0].state.raiders[1].item).toEqual("Payapa Berry");
    expect(result.turnResults[0].state.raiders[1].abilityOn).toEqual(false);
    // T2 Unburden activated after losing Payapa Berry
    expect(result.turnResults[1].state.raiders[1].item).toEqual(undefined);
    expect(result.turnResults[1].state.raiders[1].abilityOn).toEqual(true);
    // T3 Sneasel outspeeds, Unburden activated
    expect(result.turnResults[2].results[0].userID).toEqual(1); // Sneasler moves first
    expect(result.turnResults[2].results[1].userID).toEqual(0); // Rillaboom moves second
    expect(result.turnResults[2].state.raiders[1].item).toEqual(undefined);
    expect(result.turnResults[2].state.raiders[1].abilityOn).toEqual(true);
  })
  test('protection', async () => {
    const hash = "#H4sIAAAAAAAAA8VU3WvbMBD/V8w9raCHfLYlbynttsJSMlLoQ/CDKp8TNbLkSXJoKPnfd5KdNG47CKPZsDmfTrr7/XQffoEcRiCenNHAwMNoPu8w0LxASFlQZdYowkpPRxwKozNuNzd5jsI7MlmjVDjUZVA5tLfXIRK3C/RRNaWXRrtwosdgYU1VkrUwa7zVuSH10Tg32S3rONp4DKGFxUxGkNKssKhJVlYHS4zkGnbLEJP7FckM88Cz5FFmUWKDTlQRmvvR+UeppN+QJj0W0U7Bww6uA4KMUuEaVcBFy+83JTbk3Y55pbwslUQb/J695ZO4m6YM1jB6AcrpOQNo3nk0XDLifG35wmiChrb+5c4k45raGTBdKcXgO7cZEY3OF+S8f9Ltztjvvnlpq9vp1AHmMEYruUrGIkDccOuXvyq+igsijQUmsxIxVDs4zdNd4EtG9fhRCW5lKNar1qYJD8hXGp1LpkZJEZI6MRk6vyfdG/Yi5eZ7NPE77vwmmSoT2u+rEZVLrhQPgWFqqU+E/4Az1XrmjX4y1CyxMu3VaVL8IDNMvlUU5wNGfaIrV1wsKzjU3mSxvt+MuyV8AqP3LAYM7rkyOlf1CLQWp8nKz0qK1bu0pM0kDFlzMK4GrzWltuvUxj7LuXLYSCikBvLf7j0OO7tDbo2TtxXWAgr+HF12TkN23gYNNw9je3Zi2G4b9qBhWO9Y3MPZPRa398fr9k8JO/w/sP027GED0gAcC9z6Kx6NPfiEK/8d8sU/R07jJG9/A8eY9stECAAA";
    const result = await resultsFromHash(hash);
    // T1 Lucario Protects, no damage
    expect(result.turnResults[0].results[1].damage[1]).toEqual(0);
    // T2 Lucario does not protect, damage inflicted
    expect(result.turnResults[1].results[1].damage[1]).toBeGreaterThan(0);
    // T3 Stonjourner's Wide Guard blocks Earthquake
    expect(result.turnResults[2].results[1].damage[2]).toEqual(0);
    // T4 Stonjourner's Wide Guard blocks Earthquake for ally
    expect(result.turnResults[3].results[1].damage[3]).toEqual(0);
    // T5 Stonjourner's Wide Guard wore off for ally, damage inflicted (Focus Sash used)
    expect(result.turnResults[4].results[1].damage[3]).toBeGreaterThan(0);
    expect(result.turnResults[4].state.raiders[3].originalCurHP).toEqual(1);
    // T6 Talonflame's Quick Guard blocks Extreme Speed
    expect(result.turnResults[5].results[1].damage[4]).toEqual(0);
    // T7 Talonflame's Quick Guard blocks Extreme Speed for ally
    expect(result.turnResults[6].results[0].damage[3]).toEqual(0);
    // T8 Talonflame's Quick Guard wore off for ally, damage inflicted
    expect(result.turnResults[7].results[0].damage[3]).toBeGreaterThan(0);
    expect(result.turnResults[7].state.raiders[3].originalCurHP).toEqual(0);
  })
  test('sapsipper_eartheater_flashfire_stormdrain', async () => {
    const hash = "#H4sIAAAAAAAAA7VUwW7bMAz9FYOnDdAhjtOtyK1A063Asg3IboEPqk0nWmXJoOSkWZF/HyXbRdIhW4AusEFQlB7fI0X7GSqYQvHTWQMCPEyXy5EAI2uEXARXlb1TkPJ8xGFhTSlpN6sqLLzjEFmtw6FUQOuQ7m9DJkkr9NG1jVfWuHBiLGBFtm04WtsN3pvKsvtgnZsPyy6PsR5D6oKwVJGksY9YdyJbMiESM7le3TrklP6RbYlV0NnIaMtosWdnqQh9fXz+QWnld+wpj3WMc/Kwg5vAoKLVuEEdeJHkj12DvXg3KG+1V41WSAH35EnO426eC9jA9Bm4px8EQP8uY+BasOY5bmGw777a5KaT8x6EabUW8FlSyeIi4CMDXp58PwSz9NXLW+lo1CVYwkySXyff7TaKu9Nctl9Tv1y0FBo1lytVSJ18QVlxlwJ6mQ8M14Iv4+ZXW0tSOjTh0F/IJlmopgnZ/pPiP/n50r5xEVtL4YIO3K62mfQXpc+4ZCqkUSbc+4HLzXTr5E6FcbkY+0TAJ+k82TJO/qG/8NyG5JakMhcQkPdzeiX6vbiadHMa5puHNOW9GM5EJbXD3kLNijjD/gVzNGEMSgeYpxY7A7V8iqABdsW1nyIen0t8PPAHxB3gFHP6duajD+/ciscnebM3V/xX4uwk8eRc4u5n8i/CPA7X/jfO8D3QdQYAAA==";
    const result = await resultsFromHash(hash);
    // T1 Sap Sipper immune to grass, boosted atk
    expect(result.turnResults[0].results[0].damage[1]).toEqual(0);
    expect(result.turnResults[0].state.raiders[1].boosts.atk).toEqual(1);
    // T2 Earth Eater takes damage from fire move
    const t2hp = result.turnResults[1].state.raiders[2].originalCurHP;
    // T3 Earth Eater immune to ground, heals 25% HP
    expect(result.turnResults[2].results[0].damage[2]).toEqual(0);
    expect(result.turnResults[2].results[0].state.raiders[2].originalCurHP).toEqual(
      t2hp + Math.floor(result.turnResults[2].results[0].state.raiders[2].maxHP()/4)
    );
    // T4 Flash Fire immune to fire, activates ability
    expect(result.turnResults[3].results[0].damage[3]).toEqual(0);
    expect(result.turnResults[3].state.raiders[3].abilityOn).toEqual(true);
    // T5 Storm Drain immune to water, boosted spa
    expect(result.turnResults[4].results[0].damage[4]).toEqual(0);
    expect(result.turnResults[4].state.raiders[4].boosts.spa).toEqual(1);
  })
  test('fire_ground_steel_levitate_immunities', async () => {
    const hash = "#H4sIAAAAAAAAA71T32vbMBD+V8ztZQMVYjvdSt46WljHspVSyIPxg2KfE7WyZCTZbSj533eS7abtCPNLi81xuh/f9511foIKFlDcWa2AgYNFls0YKF4j5My7ohycwghHJRYLrUpudpdVhYWzFDJaSl8UM2gtmqsLj8TNBl1wdeOEVtZXJAw2RrcNRWvd4ZWqNLlrbe1yPPY4Sjv00IXBUgSSRt9j3YtsjfKRgGQHdVuPyd092RIrr7PhwZbB4sBOUhGG+ah+LaRwO/KEwzrECdxnsPMMIliJHUrPi4bf7hocxNtReSudaKRA4/seneHLkM1zBh0snoC+6VcGMLxZCJwx0nzDRRl9JwhKLPGB7OffOjrvRX0BplopGfzgpiSJoe0btT0/+X4MpvGbl1LxbNYDZLASUp78OVkJ6z/S7bZVJZpoxTs/yrUWdPfRT76mwyU3bhtd6wcaJg8QWT7SnLG4l0y9n2IqPjc1pyvY4HsJ/1dBclCQeO1brprdx9GnB/qUWG+w453Ruv44BfODgjl4hla5sHi/sBOOO3wH7nzY2VM25MJp3s/sd50GjikXwimruLQ4WKiFAkLYP/e82sUZ9Q1dzrTYG6j5Y+gZu06p6hhvMpX39dZPJU6OEqdTiV/+X1Np06O086m0L//k//Lm4Z73fwEtdRw1DAYAAA==";
    const result = await resultsFromHash(hash);
    // T1 Fire type is immune to burn
    expect(result.turnResults[0].state.raiders[1].status).toEqual("");
    // T2 Ground type is immune to Thunder Wave
    expect(result.turnResults[1].state.raiders[2].status).toEqual("");
    // T3 Steel type is immune to poison move
    expect(result.turnResults[2].state.raiders[3].status).toEqual("");
    expect(result.turnResults[2].results[0].damage[3]).toEqual(0);
    // T4 Levitate type is immune to ground move
    expect(result.turnResults[3].results[0].damage[4]).toEqual(0);
  })
  test('infiltrator_prankster_trickroom', async () => {
    const hash = "#H4sIAAAAAAAAA7VV204bMRD9FctPVFq1uRBAvHFriwoVkEiVGuXB2Z1NTLyelS+BgHjsP/T7+iUde3fJBvEQqqJsnLF3Zs6Zm/PIc37I01uLmifc8cPxuJNwLQrgkySIMquF1EhHKhZS1Jkwq7M8h9RZOjKoVFDqJtxbMOenwZMwM3BRxNJJ1DZo9BI+M+hLOi1wCec6RxKnaO1ls638aHQQXKcGMhlBSlxAUZH0RoeT6MnW7ObBp3ALWjPIA89SxDWLK9ToRBV4HR/pT6WSbkWSdFDEc3Ie3sAyIMi4KliCCrhgxGhVQk3eNsy9crJUEkywu3dGXMa3k0nCl/zwkVNO9xJ+blCzr0Jnlo26HwdsSIoOZiuWo2H7f37/YufagYIYIj03OAXj2I7/dPTgKfVwAVgKk33gyTj6PEgo7JZNSxxqWQY62iuV8GsvgSoXjfbJ6PkzeWoO+90XD73qdoL/lMId82MlHx4IvPHNhnMMzXAqzIJdeWVDUkYgTO4Vu0BcULr7HXIw5pfSumiGdzYVoRAN7EHSbaeFv9hc++D81MhlcH6MaKkA7EyDmYWKHWWiEHodV2/Qi9+tY4vJodBAqRXB+FD/E4UW2AkWU+EohKA2bvGlBvqmIF9I3hKujNCLwC3YU+WpaORGhE48EarYIFiRi9LWBIdeayIoQtAjI9MFu0EsXmHXpyzDsqp8S6Kpkio0G4bdT7JlFxAHaIPem/qioUbjCen8FS67xMChvkWa1YrPxu4K76iWwzI20WdMvWVDYef/g9MPmQH74kOzrmlN6pkZRGdRJIY735GFWaWR6jbH/SQX1M71ygupOZk/PdtU7dwhg1rdGQ/VwgtxH5Ub9cHa7T+iradma8helYjGQysdVJStYdczvi1ufxO31bW9bWHXt8y2oLuNXkCsm5GYvBveoIXXvji2LujbIfc289q6Ad4zsfubqBv34ntESwNKf/sd+qGiTmhin/4C2ZAetZkIAAA=";
    const result = await resultsFromHash(hash);
    // T4 Prankster moves first with Sunny Day, Wide Guard blocks Blizzard
    expect(result.turnResults[3].results[0].userID).toEqual(2); // Klefki moves first
    expect(result.turnResults[3].results[1].damage[2]).toEqual(0); // Wide Guard blocks Blizzard
    // T5 Infiltrator Screech hits through Mist, Wide Guard blocks Blizzard
    expect(result.turnResults[4].results[0].damage[3]).toEqual(0); // Wide Guard blocks Blizzard
    expect(result.turnResults[4].state.raiders[0].boosts.def).toEqual(-2); // Screech lowers defense
    // T8 Trick Room lets Iron Hands outspeed
    expect(result.turnResults[7].results[0].userID).toEqual(1); // Iron Hands moves first
    expect(!!result.turnResults[7].state.raiders[0].field.isTrickRoom).toEqual(true); // Trick Room is up
  })
  test('sturdy_oran', async() => {
    const hash = "#H4sIAAAAAAAAA72TS2/bMAzHv4rB0wbokEezFbk16B7dlm5oupPhg2zTiRY9DD3SBkW++yjZTtftNKAwYhAUJfL/E8U8QQNLqH45o4GBh2WeTxhorhAKFl1R905lhacjDiuja26PH5oGK+8oZI2U8dCUQXBob65jJW636JNrWi+MdvHEjMHWmtBSVJkD3ujGkFsa59bDsqujjcdYurJYiyTSmj2qDjJYHSOpkuvpdrEm93uyNTaRs+XJ1slir06oCP396HwppPBH8oRHleJUPO7gISqIZCUeUEZdtPz+2GIP7wbyIL1opUAb8x695eu0WxQMDrB8AurpOwbQf3kKXDJivuOizlZUgjbuhJS8NCZSfLLcuWO2CdRCYDpIyeAL9ZhAU/J7Sj7/itMQnE//+mhrOiGdW2MVpxvkcG2DylbIvdBbErqqrClpUUWClalJU/JI8M08ZF9FtaeuzRdUIicm8+B36ZhRZbAuzsIqyH32s6Wr9hCXjN5uzbcaFXUUXvob6m0dm/3dck0U1sbFZ56C/32xri85bGhEsNoRabxr/gfKrFPaBhvghbs5qlIYJ9xrsZBwR/MvxJzBR2noIaPYszcmwgWDH2LPq128+7P35tZkV90f4O0wZa+oXvSTvmD9XloRy/Bg9ISTLjhnDZcOewtKaKD80znjPI2UMB1SvA3YGVD8MSUMKYthOsaUnI0vOR9f8mI8ySKN0ek3xSUqPqEGAAA=";
    const result = await resultsFromHash(hash);
    // T1 Sturdy activates, Oran Berry heals
    expect(result.turnResults[0].state.raiders[1].originalCurHP).toEqual(11);
    expect(result.turnResults[0].state.raiders[1].item).toEqual("Oran Berry"); // Recieved via Symbiosis from Florges
    expect(result.turnResults[0].state.raiders[2].item).toEqual("Oran Berry"); // Not yet passed
    expect(result.turnResults[0].state.raiders[3].item).toEqual(undefined); // passed
    // T2 Sturdy activates, Oran Berry heals
    expect(result.turnResults[1].state.raiders[1].originalCurHP).toEqual(11);
    expect(result.turnResults[1].state.raiders[1].item).toEqual("Oran Berry"); //  Recieved via Symbiosis
    expect(result.turnResults[1].state.raiders[2].item).toEqual(undefined); // passed
    // T3 Sturdy activates, Oran Berry heals
    expect(result.turnResults[2].state.raiders[1].originalCurHP).toEqual(11);
    expect(result.turnResults[2].state.raiders[1].item).toEqual(undefined); // consumed
    // T4 Sturdy activates, Oran Berry heals
    expect(result.turnResults[3].state.raiders[1].originalCurHP).toEqual(1); // Sturdy activates for the last time
    expect(result.turnResults[3].state.raiders[1].item).toEqual(undefined);
    // T5 No more berries, KOd
    expect(result.turnResults[4].state.raiders[1].originalCurHP).toEqual(0); // KO
  })
  test('most_damaging', async() => {
    const hash = "#H4sIAAAAAAAAA8VUwW7bMAz9FYOnDdAhcZI2yy1rN6zAvMPaXWb4oNh0okWWDEnOEhT591GyjbRbAhTLssIGQVF8fI8S7UcoYQb5D6sVMHAwS9MBA8UrhIx5VxSdkxvhKMVirlXBze5DWWLuLIWMltInDRk0Fs3dra/EzRJdcHXthFbWZ8QMlkY3NUUrvcE7VWpyF9rapF+2dZR26EvnBgsRSGq9xqoV2RjlI6GS7dStfE3u1mQLLL3OmgdbBIsdO0lF6Pqj/IWQwu3IEw6rEKfifgc3nkEEK3GD0vOi4Q+7GjvxtlfeSCdqKdB43NYZnoTdLGOwgdkj0JleMYDuTUNgykhzgj+ht2++6GjeynkLTDVSMvjErRcXANcE6J94Emf7Pjwa/vbS1nAwaEuk8JGvMXpAbrzc97rYRfeS+1bnaASX0Tz3/cyFiW4aRx3SOXl0mvUMUzb0ShrlQoMH77hiUxxTPHip3j/Z6dISvlRY0RXBc/8/KRgxuM93bhW6PnjH2G+4wbKR/5Z/zOBbtTAYhv/gPeeH71pX0WcMX8ZXlHyLxTkyqFGDmK+ezEPWze6EdUlhNW6V+JknGUPaC+ERK7m02FmohAKqsD9gEm1ddMsrvhRqScgBYTukMw22Biq+DbgeOaGsU9zxxbnjk9yji3OPTnKPL849Pf++n/6HXkr77hXH7Or8q/6blq9fYcKy8HXvfwEyTpKzCggAAA==";  
    const result = await resultsFromHash(hash);
    // T1 Haunter is damaged most by Aerial Ace (Immune to Body Slam, SpD > Def)
    expect(result.turnResults[0].results[0].desc[1].includes("Aerial Ace")).toEqual(true);
    // T2 Magnemite is damaged most by Body Slam (Resists Flying)
    expect(result.turnResults[1].results[0].desc[2].includes("Body Slam")).toEqual(true);
    // T3 Scyther is damaged most by Aerial Ace (Weak to Flying, SpD > Def)
    expect(result.turnResults[2].results[0].desc[3].includes("Aerial Ace")).toEqual(true);
    // T4 Umbreon is damaged most by Body Slam (Neutral to moves)
    expect(result.turnResults[3].results[0].desc[4].includes("Body Slam")).toEqual(true);
    // T6 Haunter is damaged most by Air Cutter (after Fake Tears)
    expect(result.turnResults[5].results[0].desc[1].includes("Air Cutter")).toEqual(true);
    // T8 Scyther is damaged most by Air Cutter (after Fake Tears)
    expect(result.turnResults[7].results[0].desc[3].includes("Air Cutter")).toEqual(true);
  })
  test('mirrorherb_symbiosis_instruct_terrain', async() => {
    const module = await import(`./data/strats/rillaboom/shrimpiosis.json`)
    const result = await resultsFromLightBuild(module as LightBuildInfo);
    // T0: Mirror Herb copies Growth, Weakness Policy passed
    expect(result.turnResults[0].state.raiders[1].boosts.spa).toEqual(1);
    expect(result.turnResults[0].state.raiders[1].item).toEqual("Weakness Policy");
    // T5: Oranguru is targeted when using instruct, heals from Grassy Terrain after instruct instead of Qwilfish
    expect(result.turnResults[4].results[0].desc[4].includes("Def Oranguru")).toEqual(true);
    expect(result.turnResults[4].results[1].flags[4].join().includes("HP")).toEqual(true);
  })
  test('fling_symbiosis', async() => {
    const hash = "#H4sIAAAAAAAAA71UUU/bMBD+K5GfhhRpbdNCx1sLY3SDgeimSYv64CSXxqtjR7bTUiH++85OUpJqEhESE5U5O3f3fffd2U8kJeck/qOlID4x5DwMBz4RNAey8q3JktqIFTPooiGWIqFq/zlNITYaj5Tk3DoNfVJqUItLm4mqNRhnysIwKbT1GPlkrWRZ4Gkut7AQqUQzklrfNtsqj5AGbOpYQcIcSCE3kFckSyXsicuka3aZzUnNBtcEUsuzoG5N3Ao1OlIFUteH/hHjzOzRYgZyd47J7RfYWgTmVg5b4BYXFP2xL6AmrxvmJTes4AyUjXs0it66r6uVT7bk/Imgpqc+WbKcUeEtM7lL5M7Wgb+LTLFHzPvRGpgwdN5THwt6oCzx5pgf3R4Y5zSS0lL8oqjWe29Zor7EFyXnPvmKDcAqXPAZBh/+Vs/NYTA8+uGn4QBxvkuVUywvJJeqzL05UMPEGoFmsZIRbmLLYC4TxOTUMriRO+8bizcoaTDBFCFykjuTOTeZR6XSdlDmJd94PwvUoSYx9bGx98jeKUG69ofv0ptV7TjB7S+gGwFae/eSs9h2aJbQnArTqnI0GdV1ovV6pU6qkFxwqcG7QJ7U1Li2XydYjfUKW3RxXu4UFetSlaRjLvd5xKS2HcMWShaDN6cicQLw5EDxhWCvVtQEF0IbVcbmH4QClEEIljFO3Rh2NkcK/sZWeDfgbsqxdm8jtsTLCHH2imhj7KtiOVSkWuYRvyscJvDuVIT2Ii+Yzo7oNSTHvQle8Wpyr4EXaHnXticvDFf19Zr4dYTbjdvl4IQOquPATynXUK8kZ4JghudDTDPyAwypA7BrUC0kp4/OvQmYoFcH8hJSbA3OYQb23Rj1he3e0b7goy54rdO4L2j7JegLeUiO8YfBCd4TMWghzoyh8aZRt3dT3wJ71viNjwYPJRi+H+xpC/b/6DttIR7eKByt4D0n91N3cruPd+++ti74a8D4SOCnMf6zGp/50xW+HM9/AQVx5XgmCQAA";
    const result = await resultsFromHash(hash);
    // T3: Primeape uses Fling, Choice Band passed
    expect(result.turnResults[2].state.raiders[4].item).toEqual("Choice Band");
    expect(result.turnResults[2].state.raiders[2].item).toEqual(undefined);
    // T5: Passimian doesn't get the Choice Band
    expect(result.turnResults[4].state.raiders[1].item).toEqual(undefined);
    // Check that there is no OHKO
    expect(result.endState.raiders[0].originalCurHP).not.toEqual(0);

    // If Passimian moves before Primeape, it will get the Choice Band instead
    const hash2 = "#H4sIAAAAAAAAA71WW2/aMBT+K5GfVinSKAlt6RuXdWXrTaXTpCEeTHIgHo4d2Q4tqvrfd+xcCKgdqFMnqHvinPi7nGOTZzIn5yT6raUgPjHkfDJp+UTQFMjUtyGLyyBSzGCKhkiKmKr1l/kcIqNxSknObdKxT3INajS0K1G1AONCmRkmhbYZbZ8slMwznE3lCkZiLjGcSa2vq8sCLLEp1CxxjGFuYTPqxtiNUKc9KLZYgLKILIXNlU4Y8HhARQR8SFO6gHqyuLyn5rWpB1D0jelBQsUCSqFCGrDaIwUxcy5kcglp4WKuhJ1xUp1BkAE1lQNol0V2HjsksbZiZ4wzYyNmIHX3cR2bASu7BnMjhxVwC4F8HtYZlEbqysWcG5Zx5iyAJ6PodXm3EmQomU59siLnzwSLfeaTMUsZFd44kY+xfLT88TtIFHtCkM82wOcnLrvro+f3jHM6k9JybMRzyjX45KuiWq+9ca6s4yLn3CffsD9QmFviBJeoP9OXajI43vnireMWot1IlVJUPCFDladeH31kYoHQvUjJGV5EVl1fxojJqeV0JR+97yxaottBB5eYICf5aBKXJtNZrrTt437Ol96PDLMchdNtXhWzro+1vkNJziSyFZeKP91Ir1cU7wgTfgJdCtDau5OcRbaevRjbSJiGAe1Ou4TCaL8JzsUJGXCpwRugBGoFWFxb3SOUYLMm+5Rg690qbOFc5aQZljrG63TGpLbVxvJLFoHXpyJ2tvG4Zr/hflABS+4joY3KI3Mo1wBtE4IljFPX5M2L133/hbX1rsBtvF3H38d5jHsbouQ9VofYKArPo4L8Jnyd+gU2Lni3aobxKM2YTnaYV/zDg7lf8GKXXALPMPIubSX3kJ+Wu7xjEYucsKkdt0KrmA5KIaWclAmyUR/69YZr4SPlA1h9KAaS0ieXXj3QwaygfnYIcywi9nkC9hRrH4q5fTwcihxgqaoVesbQaFkBHyy2eRA1YIv0t3DbVWLoV7UK/xHwrzrDBl7d18FHIp5Wi4c7Xbjh8hGwJw3Y/yP0rIFYH3NY4OAj+7brd+oVtn8XDu7bxsbeh4onw6Rl33vwL3AvMSGOp2j2Gf7vTt0rUf2ZTl9e/gAju4g/VwoAAA==";
    const result2 = await resultsFromHash(hash2);
    // T3: Passimian loses WP, gets Choice Band
    expect(result2.turnResults[2].state.raiders[1].item).toEqual("Choice Band");
    expect(result2.turnResults[2].state.raiders[2].item).toEqual(undefined);
    // check OHKO
    expect(result2.endState.raiders[0].originalCurHP).toEqual(0);
  })
  test('ragefist_boost', async() => {
    const hash = "#H4sIAAAAAAAAA8VW227bMAz9FUNPLeCHXLe1b1naYh2aImi6DVjgB9VmbDayZEhy0qDIv4+S5VyGDS2GrUMShaIo8vCQdPLMFuycpY9GSRYzy87n807MJC+BJbETMXNCN2a1AX194Yy4zsF6UVUWlTTOohezXKu6Im2pVnAtF4rEB2XMpN02DlONlk4MpEpmXG8uFwtIrSGVVkLQV4HWBNvCueN2SWsGC3er4n7N/Ao7s3uNeQ7aocMS9jtTIIhszGUK4oKXPIedstnecfsr1T1o/hv1uOAyh0CKVBYc9FRDhj6JSi2hbMistXQaT4vPDyrgtmWLsnWRPdU+kty4ZB9QoHUSWij9OflxFrByPtCvAlbgqLKE535TQSDdtIzXwmIl0FMAT1bzSThtE7KcJUnMVuz8mVHNP8SMhffcK85ionUCa7t2VWyFBRcGYvZFStArCiprIehUZWCopP7iO7q4eyXbVtnv/vSmo26HYkzNJi0wpbhONFbj0mWzU7NZwTO1jj5y3xujWvNoVhWgXQX6Q3IxZ7fc2E00Fcr11ShvCQw+Iiqa5ijJ3oN5f4ywxXgWUzlHUmKBgntGDzch869ouaD42PTwN+BLCcZEUyUwdTE/UwtvDqjoDXshFEkv0+EJnbNLmTU1v6O+i66Q2E38+fylHKivxkIRj770ezHgny1RiOgGpZuoK5XWJppxU9DmE9fZ5g9q2EK+TjEVQNQA168F2yeESq9wKTEvHJ9HuwD55FZFo2YoTsnku1JldAN+sAi62WM+ovo1vReQz2h2IS1eC3pAca2Sj4qm25N8tAugp2oNmsjwHflXeXZ0uGE+fQlvEiZ54FVeJL6PykTd0m1OhgF4gF/StMTdfdZ08WSijI38kxBlTpXo7O9aXUOzsJI/0c0GQLg8iHsHAFq2qfidt4jdP4g9spany2hcgCvV4G0ADFtT8tPOdfdtQjvm/xfv1Lc7P/un2L/OnJqe/g/04j4JQ/oM3K904n+q/StJttsfUz9SUfIIAAA=";
    const result = await resultsFromHash(hash);
    // T1: Annihilape has taken 5 hits
    expect(result.turnResults[0].state.raiders[1].hitsTaken).toEqual(5);
    // T4: Annihilape has taken 6 hits
    expect(result.turnResults[3].state.raiders[1].hitsTaken).toEqual(6);
    // T6: OHKO
    expect(result.turnResults[5].state.raiders[0].originalCurHP).toEqual(0);
  })
  test('mew_mewtwo_boost', async() => {
    const hash = "#H4sIAAAAAAAAA71UbWvbMBD+K0Iw6MDr7KRpS79ly7aUtU0gHYOFfFDsc6xFlowkJ/FK//tOsp26JR86WErC+STf3fPcmx9oSq9o/NsoSQNq6dV8HgZUshzoInAqTxol1tyiiYFYyYTp6kuaQmwNXmklhDOKAloa0NcjF4npFVivqsJyJY2z6AV0pVVZ4G2uNnAtU4XqUhlz2x7rOFJZcKFjDQn3IIVaQ16TLLV0Nz6SadhlLiaza5QJpI5nwbxMvIQGHakCbfJD+yUX3FaocQu5v8fg7g1sHAL3UsAGhMMFze6rAhrypmVeCssLwUE7v53V7Na/XSwCuqFXDxRreh7QW9iS0XSGNhMpKpIqTfrhjoynxGmDHdlym5EPs2JE0NRu1al7EiyiIYz0wndkqZSxxCrChCDGMmsCYhThlphMlSIhiSIgVbnKSMJytgJnuyqZZtICHjIgk/H3ySlSKD/iaWisVt+UzWgw9ywvg9DzRHDaUX5ICXqDactSCLxXCRicBO9ygS773+KxvexHL/74KgrDOsKcTk2F2HztSjnLWKK25BMmhadhqRmZFRn4LqBdnPEYe9cP0Xu+aBEug8gTpK2cVTLOtJL8j/P7CWwtwRgyVYLHrr8HSfcGvVq+mvgdM7YiU6HcJoxhh8yiF8RwyCZY8VWpS/pMnVX5kivD3dzc8BSboZcuCtNJtSdWU/rXel5LLGcZ2wN0+gi8LqVl0q1GRz25U2RYz/97PP5SKic34Bdrxow5RMlrryZ1r3bYOlcmUXC5ImMmkwMEz3DA8qUGv9pP2gt6N5Ba3Cr9/+h9ZWsg98C06ZBaNJsw8AG9ivy6XY/a+36QMmGgkTTnkqL/497p5NZt68gtImaPOYTo23his6AWNGc779d6DoJeB/lZ7bCX0ZGx+x3sToGwScfOOuogD61l8Zp8zsB9U3uIflzs89YOgzRT2z96whcd0Lct9aCDvP9yvEGZz+rVe5rt3THXCVd57lYJlwbVC2zyYIEb/vgX7e0lCfEIAAA=";
    const strategy = deserialize(hash) as LightBuildInfo;
    await testOHKO(strategy);
  })
  test('instruct_cheer_reflecttype', async() => {
    const hash = "#H4sIAAAAAAAAA8VWbW/aMBD+K5E/bVImkQB9+0ZLpVYaLSqd+gHxwU0uxMOxI9uhZVX/++5ch6UVWid1YwKZ4853z3MvOXhiBTth2XerFYuZYyfzeS9milfAFjGJIichiVljwVyO6RI3S3Be1LUTWlm6kcZsaXRTo7bSa7hUhUbxXls7ab++BMyMcGixkGmVc7M5LwrInEWV0VLiRymcDZhKOyBLZiAX/k6tV1C9cG2MIo1HtSF4SfjcrfDMoSCYmvsz9ycEpogELKSJ+lKoDfndCykcScJB5e0IQjdgTUjCnxLWQDQdGH67qSEkbNtsG+lELQUY8nt0hk+8dbGI2ZqdPDEs8UHMWHjPveIoRu43XOTRKYZAwwQe3AMWsODSQsy+KQVmjVCqkRKtOgeLRfS+h+i7fS2eW2U/efNGU9JDmKndZKXIEJpE64xYUQ5bNZuVPNcP0Sn33Rg1hkezugRDxesPMcScXXHrNtFUaurkaNmWLcSIbsEYLhTmHOgcxYnPiYUzpDXbqKw0WokfxOAO+EqBtdFUS5FRvFtR4fi1GaVJ6pNMh/Q5GLzKtbcjVV+sOTvjsoomQtEIYGgJKpo2BQ3HDRQSZy8KbRxzs0ITUsNMKcC8kwBOzbXhatmYhnXFbSrVvdBWUPO+igKia3OPImH/SmCYhj556V3+7Eqbikvq1KXCRjWZ20Gs7+ueN9mKdaRAa8wreiLO1wJr6mA3o7Q3wPPPKN1xR5M9ZzNR1RKiU+DVDlIDbHRDhPD8MpJa8i2lqRa4bKJb3WRlO9AfKlNo8yjDx2dWG06TcwGyFmoZXXCVd+gtwvM2QA3G8jLWr5sL1jN5MQwD48C7woGOEbPlg36fJtq6CGvMlwj2mWHIN77YNHLlj+jaI9/WGxkkHQadGd2qP4bvkX8Df9xB75ZusB/4ow78GApQFqKzEmi20v0wSA7bu/23myDBKuyDQb/DYOQcz1ZtDfbUhWTQYbDdMdiB/eSf/lf0ISK1gV7ti3jwd1bAuwwOOgw6Pz7/egXgFqRf5B6toGP6o5X6UaRHgr4NkdgCl+XzT6b4rTocCgAA";
    const strategy = deserialize(hash) as LightBuildInfo;
    await testOHKO(strategy);
  })
  test('tera_activation', async() => {
    const hash = "#H4sIAAAAAAAAA81VS2/bMAz+K4ZOG+BDUifdllua7NFDi6CPk+EDa9O2FlkyJDltUPS/j5TtpBsKrBiwrbClSCRF8vtIxY+iFAuRf3dGi1h4sUjTSSw0NCiymJey4MU0Fp1De75mI7AV+rA0rZdGO7Y4iUVlTdeStDE7PNeloeWdce5i3PYOcys9aRzmRhdg95/LEnPvSGSNUvRTSx88zmMBuZc78HiDFobjNUcAv6W5wJIdtRDmIsx4MLuxsqrQcsKywePO1RJVsQKdo1pDAxUehP32igK+IAo5vCxe1aArHHjSxiOjyS0WMuBqzRabnt/OapYEpgJkbBH8SCARwJED+yGS3jPYO6mk55X02AQ9+WEL3LEPGWaFO2T2POVzs29xqIMbi9ApL1slAwX44C1cDNoRkCeGs1jsxOJRUBt8ioUY3jQIppOYeL0CWURn5JA0F3jv76nKJSiHsbjVGu2OAutOKdKaAh1VOhz+EE+OT/Y0CpPpLy+pphMKs3H7vJY5xeal81ZuGdFBLK5rKMx9dAahZZadhei6rdFyFZI5uUjFJTi/jzbKcLstq5HEwUdEhbMgNdmHZD7+nOGYI6Gmmi61lrVUEGh9vhmgr7GUoDnOqjYyR8pLcz8uC+oTfSThZH4SxuuJ+FobJjEl4iuMvkgXgijjMFqZ5g54e9apbXTL92LNiKJNp/OacLGD9LfwqO82cgt53YlnqwHYu0sTLfv+ez8W9hvYYv9ndQ0O0tdmlrzZzGZvLbNsuKQz6tZJb5PEz3vmID4d0hySbegGkNLbDo8Ikx4E/0MQAr4BQTwPZv0kGnigg33w4diMemn6/4InFP4vBT99Ifjh5DEDzuGfw6fSp1P+ftBIaMyy8B0KT5Y9Pf0AXB5lX+IHAAA=";
    const result = await resultsFromHash(hash);
    // T1: Annihilape has attacked 1 time, can't activate Tera
    expect(result.turnResults[0].state.raiders[1].teraCharge).toEqual(1);
    expect(result.turnResults[0].state.raiders[1].isTera).toEqual(false);
    expect(result.turnResults[0].flags[1].length).toEqual(0); // No flag for tera activation 
    expect(result.turnResults[0].results[1].desc.includes("Tera Ghost")).toEqual(false); // No Tera in the desc
    // T2: Annihilape has attacked 2 times, can't activate Tera
    expect(result.turnResults[1].state.raiders[1].teraCharge).toEqual(2);
    expect(result.turnResults[1].state.raiders[1].isTera).toEqual(false);
    expect(result.turnResults[1].flags[1].length).toEqual(0);
    expect(result.turnResults[1].results[1].desc.includes("Tera Ghost")).toEqual(false);
    // T3: Annihilape has attacked 3 times (at the end of the turn), can't activate Tera (during the turn)
    expect(result.turnResults[2].state.raiders[1].teraCharge).toEqual(3);
    expect(result.turnResults[2].state.raiders[1].isTera).toEqual(false);
    expect(result.turnResults[2].flags[1].length).toEqual(0);
    expect(result.turnResults[2].results[1].desc.includes("Tera Ghost")).toEqual(false);
    // T4: Annihilape has attacked 4 times (at the end of the turn), has activated Tera
    expect(result.turnResults[3].state.raiders[1].teraCharge).toEqual(4);
    expect(result.turnResults[3].state.raiders[1].isTera).toEqual(true);
    expect(result.turnResults[3].flags[1][0].includes("Tera activated")).toEqual(true);
    expect(result.turnResults[3].results[1].desc[0].includes("Tera Ghost")).toEqual(true);
  })
  test('tera_shield', async() => {
    const hash = "#H4sIAAAAAAAAA8VWS2/bOBD+KwJPW4DFWn6lzS3rLLYBYmw2MtCDoQMtjSQ2FCmQlFuhyH/vDC3ZquGiCIpmAZseDuf1zQv+ygp2zbJPzmjGmWfX2+2EMy1qYCknUuZExJy1DuzdLQkJW4IPpGm8NNqRxJSz0pq2QW5t9nCnC4Pkzji3Hq4Hg5mVHl8cZEbnwnZ/FwVk3iHLGqXwp5I+WFxwJjIv98LDBqzow9DGAwlnFnIZ1BrzBPUh/NZq4oRAXO+vopCEf8Izh4I8NyKceTjhKLaxsizBkh1Zw+nmKgkqXwmdgboVtSjhyDxcHzHCC6wQ9GX2qhK6hD5tCJvUQ86DuO4o4p1U0hMlPdThHeGRBOwJowyngj1Qzjwa3XQN9Nl3Q+pb5WWjZMABX7wV6/51iMpjXlPO9uz6K8PiX3HGwqf985Os664yRSHczhpfkY1tEIonHBP2IJ9EVrVsRBVCOeDsXpaV11KX0aOhJId79JcI1f2vlYD1D4be8eliysla/5s+Dw+z+OyDT/EE3X7EFFIkLGktVXNTtToP+B6U6NBjW1Z4ubNGRxshFSZ5MUHFLXsUUke3VEZ8D9rpwdv7YPn45fF0wq8wliGamJjsvrVCe0nJO5E94pXRmFtL1VpVRmYQJQ1kJLo2ObhzvMsX4P3HCucI7z2IIkq8sXUIX+sOwZDHINFF2FcWERJDliK6DZc0GNmmXLdKjfBg293YnVE4XWxM9ngSgDxKzOeQ1xW2jPXRShlBQ7QSqj7DM1Rx+RI8YwiJKKBshaVuecAtADp6aAsqb9JpbD0n3Q+hzDAkZXInw3CcyB5K6JfoZueM3Z2SRQCpS+pGuuqIhhwMaOLF8qw+k+NxAc1NJjFjjQ1w1m3+NlGCFs8HUA1Nwgeh89AdUim6H9r4R5jmnP2LLVa2lubrRPaYNqCgEb7qXlCdczQ/qc6ddt62GW1q3ITZEw6WqY+znOD2BWq1RygUbu9zIGm/KebYaMQ5+MVKjdM0w6gCf9Hj6tHV1MTxafxQ7Y+1cT4KOxST94ZRfQZdDBMOB6vFF9QMkzsoz1HwuwhGbTd9nQAmgxu0Mx7i+HXcz0buT1Wdnwz8TudHNzMaBaGiVQW0VF4p9YuR+/+h9ZYj96+e+qvv+/5i5y0vRRCM/nIYuAJQdRL+xy35PE3T5+dv7gJS1m0KAAA=";
    const strategy = deserialize(hash) as LightBuildInfo;
    await testOHKO(strategy); // OHKO after Lurantis activates Tera
    const result = await resultsFromHash(hash);
    // T0: Shield activates immediately
    expect(result.turnZeroFlags[5].includes("Shield activated")).toEqual(true); // index 5 includes flags from the boss's "dummy" turn
    // T1: Acid Spray does only 1 damage due to shield multiplier
    expect(result.turnResults[0].results[1].damage[0]).toEqual(1);
    // T2: Seed Sower activates, Grassy Seed consumed
    expect(result.turnResults[1].results[0].flags[3].includes("Grassy Seed lost")).toEqual(true);
    expect(result.turnResults[1].state.raiders[3].item).toEqual(undefined);
    
  })
  test('multi-hit-weak-armor', async() => {
    const hash = "#H4sIAAAAAAAAA61US2/bMAz+K4ZOG+BDnt3aW9quWLelKJoOOwQ5qBZjq5ZFQ5KTGkX/+yhFzqPo1gwYEsgkRZEfP1J6Zkt2xrJHi5qlzLGz+byXMs0rYIvUi1J4oZ+yxoK5vvRO3OTggoi1k6it9xikLDfY1GStcAXXeokkPqC1007dBMyMdLRjIUMtuGm/LJeQOUsmg0rRp5DORt/Ch+OupFXA0p+qeVhFWGHrdm9knoPx6GQFO80WEpS44DoDdckrnsPWuFHvuHvLdA+G/8F8UXCdQyRFowMPPTMgZCiixhKqDZmN0d4SaAn1QQ3cdWxRtT5zoDpk0q0v9kEq6bwkHVRhn+J4D1j5GDKsClbgqXKE576tIZJuO8Yb5WStZKAAnpzh07jbFeQ4WyxStmJnz4x6/jllLP7nwXCaEq13XIrknOLRxhTWbk0dXXJlIWU/tQazory6UYp2UYClroazJ3R2+1u8dMZh/9Wftvo9SnNr26yQGaX2onVGlr6grZnNCi5wnZzzMB6TxvBkVhdgfBOGYwoxZzfcuja5VehHa5J3HMYYCfXNcKnJP4D5dIiww3iaUke/G8QShQzN2Vdi5RNqvkluUWqf6qJAmQFB034iv9EAt3ssDMaDmIWk95kIXBIJuKYMNMM14fX2+XuwB74/uLYZN1xw9kqLwD/cYDLZTNdHcrnCrLHJjNuClK/ciPbf2zc86TBfqQ50Vh6Lekj9QeWA7pb0w3OoRdS/gJfJxFRo/hPmPaJnpVQqma350USPaBgd6kekqx0u14H2NtE/kAsQySXNiZ9NQY+J3l0VPyK7MTke+x1mZXKuaOzfw76IV3oUTEEk5vdqp0ZE+ziWEAup6Mak/V39dOzDFK1LwoModU7l9ejOxLPONLBZWMWf6OQmfTw8Isf+Ns4e/HT0t/Tjw/RErX/KjktMlc97/p1ehMeaPi8vvwHUuEnv8AYAAA==";
    const result = await resultsFromHash(hash);
    // T1: Rock Blast does higher damage due to Weak Armor activating after each hit
    expect(result.turnResults[1].results[1].damage[0]).toEqual(481);
  })
  test('flashfire_sunnyday', async() => {
    const hash = "#H4sIAAAAAAAAA61UTW/bMAz9K4ZOG6ABTtKPtbekWZcC7VAk6WWGD4zNOGpkyZDltFnR/15SdpKuWDFsKCIoFEWRj4+kn8RSnIvsvrZGSOHFeZLEUhgoUaSSRZWz0JOiqdFdjdkIXIE+iLbyypqaLfpSFM42FWlLu8Ers7QkLmxd3+yOrcPMKU83NWbW5OC235ZLzHxNKme1pr+V8nVnu2J34Ne057jkVxWEPQ877s3mThUFOkanSjyc6pVCnV+AyVCPoYQC98r2OAX/J9UcHbyjvliBKbAjxViPDD1zmKuQRGXXWLZkNs6wJtAS8sMKwe/Yomw5cqA6RDJbTnahtPIsKY9luCc/bIEb9qHCrnGDTJUnPPNthR3p9Y7xRntVaRUowEfv4Ka73SXkQaSpFBtx/iSo5l+lEN1KguJMEq1TUHk0In90McZM5Q1u8ctE1Y0Scgm6RilmmYOqIrym0VqKYU5cGapv8HJCXva/9HmnHPTeLLrqxRTwuwMOlggqYKUxGjpnHzj6yMEGo5FyXPdrhGU00pBz2lObraO5LRfE6uCYnNBjUPpBGTYdNXod3XETzRpjttEYtmQXYJzKk5jXUSz7sTyN5YAQ7jCeSart0GVglOEoB7FL+1JDvYouFVemzXwCLt/+X97BQcI+HSVJ5f/1BjAbJWmwOyCkFrpF52gq16HOrw8dyk8/bDRsG+rzx+GcoK6UKaIJBI7/CnQgxV25cBiGYi91EK+MQRdd2qzhOv+0toyuMYzNFDU8Yr6H2j/uE8x2/xe41KGI2eo9dEeUgbfm3tK0Bh5/O3Uob+0DoZxVlr9cAWw0owYQH0DnG1hpN4BHwUsQB685prL3WvVxB66DWCoitXdo4UFbfh58qn18eOVdg+0mSnikN6HvQ+QkTvmzlqbPzy88pMiJGAYAAA==";
    const result = await resultsFromHash(hash);
    // T1: Sunny Day does not activate Flash Fire
    expect(result.turnResults[0].state.raiders[1].ability!).toEqual("Flash Fire");
    expect(!!result.turnResults[0].state.raiders[1].abilityOn).toEqual(false);
    expect(result.turnResults[0].results[1].flags[1].length).toEqual(0);
    expect(result.turnResults[0].results[1].desc[2].includes("Sunny Day")).toEqual(true);
  })
  test('intimidate-abilities', async() => {
    const hash = "#H4sIAAAAAAAAA7VUTW/bMAz9KwFPG6BDsnYfzW1o1y2HbMCWnQIfFJtxtOrDkOS0QdH/PpKRna7YbgtiyI8UST0+0XmELcyh/pWCBwUZ5uv1VIHXDqFSDE3DYKagTxgXNxykY4tZYOiyCT5xxBsFbQx9R14X9rjw20BwE1JaDuaxYB1Npp2EdfCNjodP2y3WOZErBmvptTM5ldgdl9P5jtYGt5zVaVkbWXEMW0XTthiZnXF4stLOoG2uta/R3minWxydR/O7zn9zrTDqf7ivd9q3WETxISNTryM2Rprowh26o5h99OwRWaQ/7FDnQS3qlk8WqeUkf+BmN8aazMhkdLJPdTgC91zDyGpxjyxVJj6rQ4dF9DQo3ttsOmtEAnzIUS/L7tBQ1lBVCvYwfwS68w8KoDxrcVwpkvVjrLU3nquf4FbbhAoWnoQ2jajne2sVfNGxId6S/o7Sx1/1NDgvZi8e2ppNp8cC60owvST6/Z8lhiJXilS/tdqZludrRIXWjzrqrjv8f05snjjQ9X02jk7ehZ7v4blRmNC4ZIvNuZlcUM823PPUwXNYWHy795MVui6cm8elgp9uE1Emf0TjsHiMk9tQ9+lcPKoyuJdSRSBJ8+prmPDovwYam+J+W1gVbs4Qz9lpwDhrGVKeyFdvfEu5U8ouuTn2eFzA6QfKlNmU89fTiv8Uqurp6TdYvBAvVgUAAA==";
    const result = await resultsFromHash(hash);
    // T0: Intimidate only affects the second Raider
    expect(!!result.endState.raiders[1].boosts.atk).toEqual(false);
    expect(result.endState.raiders[2].boosts.atk).toEqual(-1);
    expect(result.endState.raiders[2].boosts.spe).toEqual(1); // boost from Rattled
    expect(!!result.endState.raiders[3].boosts.atk).toEqual(false);
    expect(!!result.endState.raiders[4].boosts.atk).toEqual(false);
  })
  test('disguise-iceface', async() => {
    const hash = "#H4sIAAAAAAAAA8VVTW/bMAz9KwFPG6BDnI9uza1LWiyHDMOQW+CD6tAOF1kyJDloWuS/j5LtJC1WYMXWBTZkiiL5Hp9k+wlymED20xkNAjxMVqu+AC1LhFQEk9bBSATUDu18FoKkLdBH01SejHYhYiCgsKau2FuaHc51bti8N84tumlTMLPkecVhZvRa2v1tnmPmHbusUYofG/Kujd2EctJveVxjHrIqGcd1HPEYtrRUFGgDOyrxNHMbQrWeSp2hmslSFnh0NtMf0v/OtUQrX3FPN1IX2IqijcdAPbO4pthEZbZYNmLWVgdPlCX2hxVK36nF3QbkKHVE0vvQ7D0p8sEij2Vc5zohAnehBsVR4Q6DVJ75LPcVtqK7TvFaeaoURQnwwVu5aFe7hryENBWwg8kT8J5/FgDtvYqOa8GycqeWHqUNYp/ZuVQOBXz4Zno3DduPIHStlICvHMDcY4krLnG80kPnHCYvbl5K+v2mwArulLTY+8JVHxn1hmxvWntuk0XjqL5YpU2hT8+rd/WvBW/Kgkra7ms4s1rOM3JFTQ7/Gd/IKjzC9ESCt/eWXFaHjemMlsI8w96dzN6dwlDAd9rKbBN0OFrvuXevEBldmkjanulRrBLNYYMc3gqGTTr3uKXVkiuJX+PkdLhC1sI434sfBNIF5/Y5u831tsZmgFI+cGY8l13ySIwuij68KPqgC32OPvhz9LNPwVuAk78GfvZFegPy1cWQx/8dmV8x/g/zIYu/toR7H6fxB5mk6eHwCz8xf95kCAAA";
    const result = await resultsFromHash(hash);
    // T1: Disguise gets busted
    expect(result.turnResults[0].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[0].results[0].flags[1].includes("Disguise activated"));
    expect(result.turnResults[0].results[0].state.raiders[1].originalCurHP).toEqual(Math.ceil(result.endState.raiders[1].maxHP() * 7 / 8));
    // T2: Mimikyu faints
    expect(result.turnResults[1].state.raiders[1].originalCurHP).toEqual(0);
    expect(result.turnResults[1].state.raiders[1].abilityOn).toEqual(false); // ability resets
    expect(result.turnResults[1].results[0].flags[1].includes("Mimikyu fainted!")).toEqual(true);
    // T3: Mimikyu switches in, Disguise gets busted again
    expect(result.turnResults[2].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[2].results[0].flags[1].includes("Disguise activated")).toEqual(true);
    expect(result.turnResults[2].results[0].state.raiders[1].originalCurHP).toEqual(Math.ceil(result.endState.raiders[1].maxHP() * 7 / 8));
    // T4: Eiscue gets hit by special move and takes damage, Ice Face doesn't activate
    expect(result.turnResults[3].state.raiders[2].abilityOn).toEqual(false);
    expect(result.turnResults[3].state.raiders[2].originalCurHP).toBeLessThan(result.endState.raiders[2].maxHP());
    // T5: Eiscue gets hit by physical move and takes no damage, Ice Face activates
    expect(result.turnResults[4].state.raiders[2].abilityOn).toEqual(true);
    expect(result.turnResults[4].results[0].state.raiders[2].originalCurHP).toEqual(result.turnResults[3].state.raiders[2].originalCurHP);
    // T6 Eiscue faints
    expect(result.turnResults[5].state.raiders[2].originalCurHP).toEqual(0);
    expect(result.turnResults[5].state.raiders[2].abilityOn).toEqual(false); // ability resets
    expect(result.turnResults[5].results[0].flags[2].includes("Eiscue fainted!")).toEqual(true);
    // T7 Eiscue switches in, Ice Face activated by a physical move, no damage taken
    expect(result.turnResults[6].state.raiders[2].abilityOn).toEqual(true);
    expect(result.turnResults[6].results[0].state.raiders[2].originalCurHP).toEqual(result.endState.raiders[2].maxHP());
  })
  test('protean', async() => {
    const hash = "#H4sIAAAAAAAAA81VS2/bMAz+K4FOG6AB8ZI9mlvQDlgPGYotN8MH1qYdLbJkSHLWoMh/HynLSTq0hwLrOsiWKYqPTx9p+17UYiHKn94aIUUQizyfSmGgRVFIFlXFQiZF79FdX7ERuAZDFG0XlDWeLd5L0Tjbd6Rt7Q6vTW1JvLXer8blELB0KtCOx9KaCtz+S11jGTypnNWaHhsVfLLdcDgIW5orrNmrgzhXccaj2dqppkHH6FSLp5XfKNTVJZgS9RW00OBROSy/Q3hMtUYHT6gvN2AaTKQYG5Chlw4rFQ/R2S22A5m9M6yJtMTzYYcQRrbotJw5Uh0zmT0f9lZpFVhSAdu4T3HYAnccQ8VZ4w6ZqkB41vsOE+l+ZLzXQXVaRQrwLjhYpd3xQAFEUUixE4t7QTX/LIVIVx4VF5JoXboWCHvk7EyuQXuU4s03O1kOaN8KaXqtpfgKriLsMcRHCnEcxWFUzrI/LtrKptMhQM55rJtQwQxxWMSdvBh8Pz0MOIa8kFSHFdpfvgQHFZftwSrBvXFUKjB/D+mqr9790MAdukSnQE+WJZ4gs9UJItX7Rm2h3PTiTHpJJp8AMvtfgMxfG0iRWn0eo0SRyDlVNRu1HxKqhK1V1ETZqf9mA1x+wwjrlPySV3A9DpNo4Y58YtOObnPqiewY4ayDXj5xRqkfifCcvCvrwyR+F5Vpnpd9RuNVjs3jH5aZ+iuf8qee/xR0z+ieF/G3kUZRHA6/AepWudKABwAA";
    const result = await resultsFromHash(hash);
    // T1: Protean activates (ground)
    expect(result.turnResults[0].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[0].state.raiders[1].proteanLiberoType).toEqual("Ground");
    expect(result.turnResults[0].results[0].desc[0].includes("Protean")).toEqual(true);
    // T2: Protean does not affect moves of other types (flying)
    expect(result.turnResults[1].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[1].state.raiders[1].proteanLiberoType).toEqual("Ground");
    expect(result.turnResults[1].results[0].desc[0].includes("Protean")).toEqual(false);
    // T3: Meowscarada faints
    expect(result.turnResults[2].state.raiders[1].originalCurHP).toEqual(0);
    expect(result.turnResults[2].state.raiders[1].abilityOn).toEqual(false); // ability resets
    expect(result.turnResults[2].results[1].flags[1].includes("Meowscarada fainted!")).toEqual(true);
    // T4: Meowscarada switches in, Protean activates (flying)
    expect(result.turnResults[3].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[3].state.raiders[1].proteanLiberoType).toEqual("Flying");
    expect(result.turnResults[3].results[0].desc[0].includes("Protean")).toEqual(true);
    // T5: Protean does not affect moves of other types (ground)
    expect(result.turnResults[4].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[4].state.raiders[1].proteanLiberoType).toEqual("Flying");
    expect(result.turnResults[4].results[0].desc[0].includes("Protean")).toEqual(false);
  })
  test('trace', async() => {
    const hash = "#H4sIAAAAAAAAA8VUTY/TMBD9K9WcQPIh3S4f29uyRbCHIgSVOEQ5uMkkNXXsyHbCdlf978w4TruLQEIChBI5z+P5ePMyyQPUsITyq7cGBARY5nkmwMgWoRAMVcVgLqD36G5X7CRdgyFC2wVljWePCwGNs31H1tYOeGtqS3BrvV9P2zFh6VSgE4+lNZV0h7d1jWXwZHJWa3rsVPDJd8fpZNjTWmHNUZ2MaxVXPLltnGoadMxOtXje+Z1CXd1IU6JeyVY2eDKO208y/My0QSd/Yb7ZSdNgEsXYgEy9dFip2ERn99iOYvbOsCXKEvvDDmWY1KJuuXKUOlYyB252q7QKjFTANp5THvbAgXOouGockKUKxGdz6DCJ7ifFex1Up1WUAO+Ck+t0OjUUJBSFgAGWD0Dv/LUASHceDVeCZL3e2lZ6Y7/BE1xL7VHAZ9rMvkhnlGlAmF5rARvV0ryImOIlpThdxXEyLuY/3HQ0z7IxQV5ETI/o/eppiinJlSDlP1rSySIPwhkmaiun7u9Z3ZHVGycH/CuseHtmQS/xnXQVDlax0I9w4rFxsvwDFtnvkFhQ/2ovy10Pj1Ai8OyDnV2PE/V84vGeaB7+gRqX/5tIkWb3MmaJcDFW5umnsvPJ/CLRSuRaRZ/r/DxfHLW2Pszih0/jTbEZRafY4HocF2jlHUXG0Yz186zg/0JRHI/fAb6+ps5ZBQAA";
    const result = await resultsFromHash(hash);
    // T0: Trace activates, due to speed considerations, the weather ends up as Snow (Snow -> Rain -> Snow (Trace))
    expect(result.endState.raiders[2].ability).toEqual("Snow Warning");
    expect(result.endState.raiders[2].originalAbility).toEqual("Trace");
    expect(result.endState.raiders[0].field.weather).toEqual("Snow");
    expect(result.turnZeroFlags[2].includes("Trace copies Snow Warning")).toEqual(true);
  })
  test('clearamulet-clearbody-whitesmoke', async() => {
    const hash = "#H4sIAAAAAAAAA7VUwW7bMAz9FUOnDVABJ2nWNbc0abAA61CsAXYwfGBtxtYiS4YsZ82K/PtI2U62Yt1lKCIoTxRJPT5KfhZbMRPZ98YaIYUXsySJpTBQoUglQ5UzGEnRNujWS3YCV6AP0NZeWdOwx1iKwtm2Jmtl97g2W0vw0TbN3bDsEmZOedppMLMmB3e43W4x8w2ZnNWa/krlm9635HTgdzTnuOWoGsKchxlPbhunigIds1MVnldNqVDnCzAZ6iVUUODJ2C2/gv+baYMOXjEvSjAF9qIY65GpZw5zFYqo7Q6rTszWGbYEWUJ9WCP4QS2qlk8OUoeTzIGLfVRaeUbKYxX2KQ974J5zqDBr3CNL5YnP5lBjL3ozKN5qr2qtggT45B3c9btDQR5EmkqxF7NnQT3/KIXoRxIM15JknbsMjDKc/Qy3oBuUYm1IaJUH9UyrtRSfwOXEO4R/oPDTLz0OxsnoxaCtq6kUK8UVJmKlSQxfOvsjMF+41mQlgVsqASuMHmpE7jz7RytqA0k5juOYQh9aYw7REli5z0jhaXfolZzGPMZh0GGTaXocGF1LauEGWmdZmw5c3IPOES5uNPw8lzunlrvo3irDd3ehEVw0r1qNvJzndEF441T7eDruqyf07/pHRD8ImFBa22C0sNUjhFNa1/A9Y48kDU5n4nSBlg4KqKnV4g/cM+443ljuyX816EzwFSoTks66nQW+kSfU0/hGr5kaV9GreGsel1Lcqx1kZSt+Qz2Pd19sNO/e1vu3IpL2j+cyZAlwIl90dTTsTHtmPb9K0SdjdL6ak44yv1viG1NcH+Vdi90kKniimJiDwuFJnPJXKU2Px1+hGa/t1wUAAA==";
    const result = await resultsFromHash(hash);
    // T0: Clear Amulet, Clear Body, and White Smoke prevent drop from Intimidate
    expect(result.endState.raiders[1].boosts.atk).toEqual(0);
    expect(result.endState.raiders[2].boosts.atk).toEqual(0);
    expect(result.endState.raiders[3].boosts.atk).toEqual(0);
    expect(result.endState.raiders[4].boosts.atk).toEqual(-1); // Pikachu is affected by intimidate
    // T1: Clear Amulet does not block drop from Close Combat use
    expect(result.endState.raiders[1].boosts.def).toEqual(-1);
    expect(result.endState.raiders[1].boosts.spd).toEqual(-1);
  })
  test('powerofalchemy-receiver-scrappy', async() => {
    const hash = "#H4sIAAAAAAAAA71US2/bMAz+K4ZOG+ABdh7r2lvabmsP2aPpLfCBtWlbiywZkpw2KPLfR8p20hXrqd1ggaYoPj5+ov0oSnEm8l/OaBELL87W6yQWGhoUWcyqLFhJY9E5tNeX7AS2Qh9U03pptGOPSSwqa7qWrI3Z4rUuDal3xrnluO0T5lZ6OnGYG12A3X0uS8y9I5M1StGrlt4NvjWnA78hWWDJUS0EWQSJB7dbK6sKLaOTDR53rpaoigvQOapLaKDCg7Hf3oD/m+kWLbxgvqhBVziQoo1Hhp5bLGRoojUbbHoyO6vZEmgJ/WGL4Ee2qFuuHKgOlfSOm72TSnrWpMcmnFMe9sAt55BBKtwiU+UJz+2uxYF0NzLeKS9bJQMF+OAtLIfTsSEPIstisRVnj4Lu/FMsxLDWwXAaE61fUVfAKUalBOUwFu++mWjR43wvYt0pFYsrsAWhDsEfKfjwZPvROE2fLTo6mVP22jiaiLVY1VCY++gcwhisVFdUGJ2b5o52F0aXNIHRDTA3q5bYIR4nSZJQ4NWu1cZJZjbUOolnc14TWgnXmM6z/QjkNKZ7+6KgkRVP6EEbmlvlFtp298q+0j58ncUpI8zC9oiArn/Z8VST/LBQRsGh/g9zjzb6XkYLldfYvBoIle+hiHNT7KIVtSteQDWl6uCcbCTw/D7RB2w3mKPc8lS9Faafncw30cJ7yDcvwZoRFLmBvO7EE+3tZ/EI6xmQbPgoZiFLUKd9Zf6sqGw6mucDrAFcI4m79Dh6HLWkYY/CH0XqimITih5ive2wF6KBB4pMOHQMnpFjeshzvEwapv9SffKk+h/XRnPzTwEQ/esk/G4nWXilWbbf/waZwz1OuQYAAA==";
    const result = await resultsFromHash(hash);
    // T1: Flamigo faints, Power Of Alchemy and Receiver copy Scrappy
    expect(result.turnResults[0].state.raiders[2].ability).toEqual("Scrappy");
    expect(result.turnResults[0].state.raiders[2].originalAbility).toEqual("Power Of Alchemy");
    expect(result.turnResults[0].state.raiders[3].ability).toEqual("Scrappy");
    expect(result.turnResults[0].state.raiders[3].originalAbility).toEqual("Receiver");
    // T2: Scrappy lets normal moves hit Ghost types
    expect(result.turnResults[1].results[1].damage[0]).toBeGreaterThan(0);
    // T3: Scrappy lets normal moves hit Ghost types
    expect(result.turnResults[2].results[0].damage[0]).toBeGreaterThan(0);
  })
  test('guaranteed-critboosts', async() => {
    const hash = "#H4sIAAAAAAAAA71VTW/bMAz9K4JOG6ABzkfbtbcmaZcCSQ9Nhh0CH1SbsbXIkiHJab2i/32UYsdJ0R42tIUNhiIl8vGRcp7oml7Q5LfVijLq6MVqFTGqeAE0Zl4VqVd6jFYWzM3Eb+ImAxdUXTqhlfU7+oxmRlclWgu9hRu11qjea2vn7XIXMDHCocdColXKTX21XkPiLJqMlhJ/cuFsszf34bjboExh7U+VPMg0SNhvWxqRZWA8OlFAt7K5AJmOuUpATnjBM9gbd8s77l4zLcHwN8zjnKsMGlKUduChJwZSEYoo9QaKHZmVUd4SaAn1QQnctWxhtT5zoDpkUrUv9l5I4bwmHBTBj3H8Dtj6GCJICVvwVDnEs6xLaEi3LeOVdKKUIlAAj87weeNtC3KcxjGjW3rxRLHn3xmlzbsKhnOGtN5xkZIRxkPHBBKRVlDDt6mwlaBszaUFRheJ4WWJeFUlJaOXKXKlsL8hyilG2T/xc2sc9F686OpFmPCH4T7ZimIDSwnk0hj94LOPDN8CGQnj+z4DviYjyVNf9p1ONmSpi3tkdXCCQfAwF/JBKL91VMkN+emHaFEpVZMJr3FfgHHGTiP/DiPWj9hZxAaIsMV4zrC3N8qBhNDKTm3K/nKryeWuVV/b2qfcpPX/VR4CrOhCiRLIItcOUXr7Kg6uDhbOzVSrJN8gMfRIb/tRlWDIrEr8nVkkGuPNIIzhSMt0j65/0kdkO/kvCG9FljuykNzmPj3IUqiMTHlgG2cBIPGOcS6k9J5feGlMV0zD/BE3XXEDnB+lBJ7lYaQPF6/yjhP6RxsylvzhvQq81kllyZUCk9UhQQbkWtg3GzJkdF55roN8HeWMK8sdGYEx9bvh9PS+BBU3t3cYggUVOT3qWb91nDRgG8iFwOHudd3Ac1/m2joSPn6YCwuJ8FY0Z52pYCdowR/xZGhke3iIG3v7OMeUDj4HQP8AQNfEz8o+wPz78kOn2LA7/ZGZhweZDz4nGOBDC8fJW0XhL7GPcsCGcVjgE8fPz38BUopEdGUIAAA=";
    const result = await resultsFromHash(hash);
    // T1: Honchkrow has a guaranteed crit (high chance move + Super Luck + Scope Lens)
    expect(result.turnResults[0].results[0].desc[0].includes("critical hit")).toEqual(true);
    // T2: Focus Energy boosts Annihilape's crit stages by 2
    expect(result.turnResults[1].state.raiders[3].critBoost).toEqual(2);
    // T3: Annihilape has a guaranteed crit (Razor Claw + Focus Energy)
    expect(result.turnResults[2].results[0].desc[0].includes("critical hit")).toEqual(true);
    // T4: Fling + Lansat Berry raises Inteleon's crit stages by 2
    expect(result.turnResults[3].state.raiders[1].critBoost).toEqual(2);
    // T5: Inteleon has a guaranteed crit (high chance move + Lansat Berry)
    expect(result.turnResults[4].results[0].desc[0].includes("critical hit")).toEqual(true);
  })
})


// Test cases for OHKO strats
describe('OHKO tests, Official Strats', () => {
  // Decidueye seems to have been a 93.8% chance rather than a guarantee
  // test('decidueye', async () => {
  //   const module = await import(`./data/strats/decidueye/main.json`)
  //   await testOHKO(module as LightBuildInfo);
  // })
  test('samurott', async () => {
    const module = await import(`./data/strats/samurott/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('samurott/tauros', async () => {
    const module = await import(`./data/strats/samurott/tauros.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('typhlosion', async () => {
    const module = await import(`./data/strats/typhlosion/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('inteleon', async () => {
    const module = await import(`./data/strats/inteleon/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('chesnaught', async () => {
    const module = await import(`./data/strats/chesnaught/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('chesnaught/gholdengo', async () => {
    const module = await import(`./data/strats/chesnaught/gholdengo.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('delphox', async () => {
    const module = await import(`./data/strats/delphox/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('delphox/rain&sustain', async () => {
    const module = await import(`./data/strats/delphox/rain&sustain.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom', async () => {
    const module = await import(`./data/strats/rillaboom/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/tickle_squad', async () => {
    const module = await import(`./data/strats/rillaboom/tickle_squad.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('mewtwo', async () => {
    const module = await import(`./data/strats/mewtwo/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
})

describe('OHKO tests, Alternative Strats', () => {
  test('rillaboom/shrimpiosis', async () => {
    const module = await import(`./data/strats/rillaboom/shrimpiosis.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/pump_up_the_cham', async () => {
    const module = await import(`./data/strats/rillaboom/pump_up_the_cham.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/timmys_revenge', async () => {
    const module = await import(`./data/strats/rillaboom/timmys_revenge.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('mewtwo/ape', async () => {
    const module = await import(`./data/strats/mewtwo/ape.json`)
    await testOHKO(module as LightBuildInfo);
  })
})


