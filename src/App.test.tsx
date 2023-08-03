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
    turns: buildInfo.turns,
    groups: buildInfo.groups,
  }
  const battle = new RaidBattle(battleInfo);
  const result = battle.result();
  expect(result.turnResults.length).toEqual(strategy.turns.length); // this checks that the calc didn't encounter an error
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
  // check that all raiders did not faint
  for (let i=1; i<=4; i++) {
    expect(result.endState.raiders[i].originalCurHP).not.toEqual(0);
  }
}

// Test cases for specific interactions
// these also ensure that URL hashes are not broken
describe('Specific Test Cases', () => {
  test('booster_instruct_symbiosis', async () => {
    const hash: string = "#H4sIAAAAAAAAA7WUW2/aMBSA/4rlp03KAyWwVX2pgDJKV1qtdE+IB5OcgBfHjnyhRRX/feeYQMtUadNURLAcn9t3Ls4LL/gFz345o3nCPb+YzVoJ16ICPk9oK/Nmk1npUcVBZnQu7GZYFJB5h0fWKEVKZwkPDuz4ijwJuwQft6b20mhHGu2EL60JNZ5WZg1jXRjcLoxzk/3rzo82Hsh1ZiGXMUhtSqh2kMFqOomeXEO3Ip/Cl7jmUBBnLeKaxxWa6IgKvMkP9RdSSb/BnfRQxXN0ThJYUwQZVwVrUBQXrHjc1NDAuz15UF7WSoIlu2dvxSRK5/OEr/nFC8eafkn4dHqTsrE1ml0LnZMxPj3nyWwWlc4TzONByJz10S1KH6RSYmEMkY2scG7DpgHLyhMdlEr4DdYd4aPxVzQ+/Obb/WF69seDorMWxrkzthKY1Yxf2VCxPggv9ZKQMmsW+JIRQd/kGFMJIrg1T+y7zEqsZNpFFzNkMk9+FdVMtQjW0Xz0gyrZzxrTbyDOE+znyJQBhUf5/wjCluzKyjXsfFAx2FCDXVJLermohPaH/Nrddvz/e46Xl5eU4EAZB2yAiCICAlaNUdaYCenN3qDiiDzaoEviu7dCL4Ml7ummWkjjJB3fygLYvV1EZpUf8bVeCf/OF5s442PtvA2Zf4cmpcJ5oKGfiOBWMRz/ZiXonI2wfPQ6wGmznmGWovwopmtQNY5DbBX6fMS2K3gHsIMtHd3dPwzZZBghl7IUlq7ipzvDervr9Xk/r9cI/J/zuuN6BZg3d6aLHYuy+NY5oGLpWruzNCmEctCsvJKao/n2YECgdGGRsoWT2thgR2C38Eo8R4u9TRe1jkIeGogs6cmCto6DvplidHC6XA91RPOe9yIr2WAF9NFqnzBq503U41lMXz18eNTucYmPvxunKDJOMYo6cxzo7W9OYO9BiQcAAA==";
    const build = await deserialize(hash);
    expect(build).not.toBeNull();
    testOHKO(build as LightBuildInfo);
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
    // T4 Flash Fire immune to fire, boosted spa
    expect(result.turnResults[3].results[0].damage[3]).toEqual(0);
    expect(result.turnResults[3].state.raiders[3].boosts.spa).toEqual(1);
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
    expect(result.turnResults[7].state.raiders[0].field.isTrickRoom).toEqual(true); // Trick Room is up
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
})

// Test cases for OHKO strats
describe('OHKO tests, Official Strats', () => {
  test('decidueye', async () => {
    const module = await import(`./data/strats/decidueye/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('samurott', async () => {
    const module = await import(`./data/strats/samurott/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('samurott/tauros', async () => {
    const module = await import(`./data/strats/samurott/tauros.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('typhlosion', async () => {
    const module = await import(`./data/strats/typhlosion/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('inteleon', async () => {
    const module = await import(`./data/strats/inteleon/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('chesnaught', async () => {
    const module = await import(`./data/strats/chesnaught/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('chesnaught/gholdengo', async () => {
    const module = await import(`./data/strats/chesnaught/gholdengo.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('delphox', async () => {
    const module = await import(`./data/strats/delphox/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('delphox/rain&sustain', async () => {
    const module = await import(`./data/strats/delphox/rain&sustain.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('rillaboom', async () => {
    const module = await import(`./data/strats/rillaboom/main.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/tickle_squad', async () => {
    const module = await import(`./data/strats/rillaboom/tickle_squad.json`)
    testOHKO(module as LightBuildInfo);
  })
})

describe('OHKO tests, Alternative Strats', () => {
  test('rillaboom/shrimpiosis', async () => {
    const module = await import(`./data/strats/rillaboom/shrimpiosis.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/pump_up_the_cham', async () => {
    const module = await import(`./data/strats/rillaboom/pump_up_the_cham.json`)
    testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/timmys_revenge', async () => {
    const module = await import(`./data/strats/rillaboom/timmys_revenge.json`)
    testOHKO(module as LightBuildInfo);
  })
})


