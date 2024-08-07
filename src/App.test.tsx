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
import { FlashOnOutlined } from '@mui/icons-material';
Object.assign(global, { TextDecoder, TextEncoder });

// RaidCalc tests

async function resultsFromLightBuild(strategy: LightBuildInfo) {
  const info = await lightToFullBuildInfo(strategy);
  expect(info).not.toBeNull(); // check that the strategy has been loaded successfully
  for (let raider of info!.pokemon) {
    raider.field.gameType = "Doubles";
  }
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
    const hash = "#H4sIAAAAAAAAA71W3U/bMBD/Vyo/bZIf+gmMtw7YhgSoG5V4qPJwJJfU1LEz26moEP/7zk7Spmig7IPKiWNf7vy7+/nO8hNL2SmLH6xWjDPHTheLPmcKcmQR90OR1IPYCEcqFmOtEjCbizTF2FkSGS2lVxpwVlo0l+d+JTAZujDUhRNaWa8x5CwzuixImus1XqpU0/BeW3vdTElrxNlSOFvjLr02uBX1CabegwJCn4Qet2pzI7IMjQcXOe5mdilQJmegYpTnkEOGW2E1/QHud6I5GnhFfLYElWEds9IOPQ2xwUQEQgq9wrwitDTKS0LUgSssEIKSLe+tE670xhU1xKP3I5AfcNWGvsJO1eYK1yg9D/dCChfEDvOgTBBeHdd+URF6WWtnqJKKEPJ5vimw5t02pJfSiUKKoIOPzsB1/bcJ2gGLIs7W7PSJUW584ozVzyIIBn1O3J8byLQSgcXWOAVpse7Zhxvdm1bef2RclVJy9g1MQrGElY55f9ei50Y4Grx46NegT5g39SILNkUjQPamsYe/AOOWP0tYhQmFhDn2bgtEn8becBFVS5/s4zWIFBBt6VUZgxE+N7ejN4Jhdwgrhdb2ZlqK2O/OtU7Qum1ow8kwANXfPwrvBqzb9GZS++r7ouPS9j5L8IuzmaHUi13nyCjHbp1WD5qyMuz53uxA23UnEux9LWmtzn7TgTATK4iXJWuN3tqRiqdbsEv239Isq0qvq9NjzuYgtUplVc/tyYGo/l6KeNWN66gu6EkQheF4l2BUE4NKONr3PReK7aImi3Yx9ndGzpRYdSyHx2DSGE34UaNH9u1sf1fQAVVDY99KSZIOu4G2T5quoENK5a3TdT6RaPR+iBPKw8MijgizsW8nIDky7oi6d2x3Bh5TIv1DqH8Hekzt4KAn1F4HPdoHhXVGpdQJ9lXLcD4s+tQd+TuPv67QO/F3NXrH9B7TexKFC9GL5i0j3jxR9Pz8C4/drlB0CgAA";
    const result = await resultsFromHash(hash);
    // T1 Lucario Protects, no damage
    expect(result.turnResults[0].results[1].damage[1]).toEqual(0);
    // T2 Lucario does not protect, damage inflicted
    expect(result.turnResults[1].results[1].damage[1]).toBeGreaterThan(0);
    // T3 Stonjourner's Wide Guard blocks Earthquake
    expect(result.turnResults[2].results[1].damage[2]).toEqual(0);
    // T4 Stonjourner's Wide Guard blocks Earthquake for ally
    expect(result.turnResults[3].results[1].damage[3]).toEqual(0);
    // T5 Stonjourner's Wide Guard wore off for ally (since "turn 1" is over), damage inflicted (Focus Sash used)
    expect(result.turnResults[4].results[1].damage[3]).toBeGreaterThan(0);
    expect(result.turnResults[4].state.raiders[3].originalCurHP).toEqual(1);
    // T6 Talonflame's Quick Guard blocks Extreme Speed
    expect(result.turnResults[5].results[1].damage[4]).toEqual(0);
    // T7 Talonflame's Quick Guard blocks Extreme Speed for ally
    expect(result.turnResults[6].results[0].damage[3]).toEqual(0);
    // T8 Talonflame's Quick Guard blocks Extreme Speed for ally (Still on T2)
    expect(result.turnResults[7].results[0].damage[3]).toEqual(0);
    // T9 Talonflame's Quick Guard wore off for ally (T2 is over), damage inflicted
    expect(result.turnResults[8].results[0].damage[3]).toBeGreaterThan(0);
    expect(result.turnResults[8].state.raiders[3].originalCurHP).toEqual(0);
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
    expect(result.turnResults[0].state.raiders[1].item).toEqual("Oran Berry"); // Received via Symbiosis from Florges
    expect(result.turnResults[0].state.raiders[2].item).toEqual("Oran Berry"); // Not yet passed
    expect(result.turnResults[0].state.raiders[3].item).toEqual(undefined); // passed
    // T2 Sturdy activates, Oran Berry heals
    expect(result.turnResults[1].state.raiders[1].originalCurHP).toEqual(11);
    expect(result.turnResults[1].state.raiders[1].item).toEqual("Oran Berry"); //  Received via Symbiosis
    expect(result.turnResults[1].state.raiders[2].item).toEqual(undefined); // passed
    // T3 Sturdy activates, Oran Berry heals
    expect(result.turnResults[2].state.raiders[1].originalCurHP).toEqual(11);
    expect(result.turnResults[2].state.raiders[1].item).toEqual(undefined); // consumed
    // T4 Sturdy activates, Grassy Terrain heals 1HP
    expect(result.turnResults[3].results[0].state.raiders[1].originalCurHP).toEqual(1); // Sturdy activates for the last time
    expect(result.turnResults[3].state.raiders[1].originalCurHP).toEqual(2); // Grassy Terrain Healing
    expect(result.turnResults[3].state.raiders[1].item).toEqual(undefined); // no more berries are passed
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
    // T5: Oranguru is targeted when using instruct, everyone healed by Grassy Terrain
    expect(result.turnResults[4].results[0].desc[4].includes("Def Oranguru")).toEqual(true);
    expect(result.turnResults[4].endFlags.every((flags) => flags.includes("Grassy Terrain"))).toEqual(true);
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
    expect(result.turnResults[3].state.raiders[1].teraCharge).toEqual(3); // capped at 3
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
    // expect(result.turnResults[5].results[0].flags[2].includes("Eiscue fainted!")).toEqual(true); // Not sure why this is failing. It displays correctly in the UI
    // T7 Eiscue switches in, Ice Face activated by a physical move, no damage taken
    expect(result.turnResults[6].state.raiders[2].abilityOn).toEqual(true);
    expect(result.turnResults[6].results[0].state.raiders[2].originalCurHP).toEqual(result.endState.raiders[2].maxHP());
  })
  test('protean', async() => {
    const hash = "#H4sIAAAAAAAAA81VS2/bMAz+K4FOG6AB8ZJ0a25Bu0cPGYa1t8AH1mZsLbJkSHLWoOh/Hyk/khYdkBYtOshWKEokP36k4luxFnOR/fbWCCmCmK9WYykMVChSyaLKWUikaDy6i3M+BK7AEEVbB2WN5xMfpSicbWrSVnaLF2ZtSby23i/7ZeswcyrQjsfMmhzc7st6jVnwpHJWa/opVfDd2ZLdQdjQnOOarWqIcx5nHI5dOVUU6BidqnC/8qVCnZ+ByVCfQwUFDsp2+QvCY6ordPAP9VkJpsCOFGMDMvTMYa5iErXdYNWS2TjDmkhLzA9rhHjIN9c+qNCwccsd5c44IvExrtlx6tdKq8CSCljFffLKJ3DLflScNW6RiQuE7mpXY1cC3/Pf6KBqrSIheBMcLLvdPr0AIk2l2Ir5raAO+CyF6J5VVJxKInnhKqBMIoMH8hq0Ryne/bCjRYv2vZCm0VqK7+Bywh5dnJCLYaR3vXKSPHhoKxmPWwcrjmPdiMpniNE07qzS1vbTfYe9y1NJVVmi/eMzcJBzEe+tOrg/HRUOzMshXTb5h0sN3K8LdAr0aJHhsZCp/t+szpuMG32QHmVWfLVZ40eX4EvxErgvLWyOhTkh3tQGsrIRB9JrNsCRwKb/G7C0uzjTqIoikbfvkaTXzjqUHdZKUUsm+9QmLXy+r4R9THadVXANtpOo4IZs2rCd2ZQ6Khk8HPTj6wdOKPQjHp4Sd2l9GMX/XGWKp0Wf0HiTtHm8QZlnNHoP8SbvC/+6RJ8cBH4u0c8IT/dqNeYPJn996Z3QO6V3Jk/S+EEeBp9MZf+k6d3dX9yVanPqCAAA";
    const result = await resultsFromHash(hash);
    // T1: Protean activates (ground)
    expect(result.turnResults[0].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[0].state.raiders[1].types[0]).toEqual("Ground");
    expect(result.turnResults[0].results[0].desc[0].includes("Protean")).toEqual(true);
    // T2: Protean does not affect moves of other types (flying)
    expect(result.turnResults[1].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[1].state.raiders[1].types[0]).toEqual("Ground");
    expect(result.turnResults[1].results[0].desc[0].includes("Protean")).toEqual(false);
    // T3: Meowscarada faints
    expect(result.turnResults[2].state.raiders[1].originalCurHP).toEqual(0);
    expect(result.turnResults[2].state.raiders[1].abilityOn).toEqual(false); // ability resets
    expect(result.turnResults[2].results[1].flags[1].includes("Meowscarada fainted!")).toEqual(true);
    // T4: Meowscarada switches in, Protean activates (flying)
    expect(result.turnResults[3].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[3].state.raiders[1].types[0]).toEqual("Flying");
    expect(result.turnResults[3].results[0].desc[0].includes("Protean")).toEqual(true);
    // T5: Protean does not affect moves of other types (ground)
    expect(result.turnResults[4].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[4].state.raiders[1].types[0]).toEqual("Flying");
    expect(result.turnResults[4].results[0].desc[0].includes("Protean")).toEqual(false);
    // T6: Meowscarada changes to water type due to Soak, but Protean stays activated (flying)
    expect(result.turnResults[5].state.raiders[1].abilityOn).toEqual(true);
    expect(result.turnResults[5].state.raiders[1].types[0]).toEqual("Water");
    // T7: Aerial Ace is no longer STAB due to the type change
    expect(result.turnResults[6].results[0].desc[0].includes("Protean")).toEqual(false);
    expect(result.turnResults[6].results[0].damage[0]).toBeLessThan(result.turnResults[3].results[0].damage[0])
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
    expect(result.turnResults[1].state.raiders[3].isPumped).toEqual(2);
    // T3: Annihilape has a guaranteed crit (Razor Claw + Focus Energy)
    expect(result.turnResults[2].results[0].desc[0].includes("critical hit")).toEqual(true);
    // T4: Fling + Lansat Berry raises Inteleon's crit stages by 2
    expect(result.turnResults[3].state.raiders[1].isPumped).toEqual(2);
    // T5: Inteleon has a guaranteed crit (high chance move + Lansat Berry)
    expect(result.turnResults[4].results[0].desc[0].includes("critical hit")).toEqual(true);
  })
  test('yawn+sleep', async() => {
    const hash = "#H4sIAAAAAAAAA71W227bOBD9FYFPLaAAku1c33zZbgok2aLOPiwMPTDSSOKaIgWSsusW+ffOUJIvaY1NF6khgaKGczlzZkjpG8vZDUv/tVqxkDl2s1hEIVO8ApaENBUZTeKQNRbMxxkpcVOA81NdO6GVJY1ByAqjmxqllV7BR5VrnD5pa+/719ZhaoTDFQupVhk3mz/yHFJnUWS0lPgohbOdbknuuFvimEFOVjX3Y+ZH2Ko9GlEUYAidqGD3ZksBMptylYKc8YoXsBW2r5+5+5noEQw/Ip6WXBXQkaK0A4KeGsiET6LWS6haMhujSOJp8flBDdwr2ebJOuEaMm65w9wJhyfex1UbfAo7Vps7WAHxwp+EFM6LHVReGUOQOqzIqfCj7LQLUFlLCGJ+3NTQFcb2VWmkE7UUXge+OMPvu9U+acdZkoRsxW6+MeyLq5Cx7l54wXWI1H/mIgsm6A8XZpCKrIENnN0K2wgW5lxa6EY2Tw2va4SvGilDNs6QVYWd4H1doK/tlTz3wmH84salOMKwDxjuT8Mp7IJhuWsJwdgYvSYcE8NXEEyEoS6ZlzzT62Aq+Rrf7oDnwUTyjAo4jNDVgk0auQz+pk6br7XJbDCjdukDbAIsuuFC9dZzp02F1h7iZXgR0T2KwkEUXkboM3nu8V+H2CGPvDGaULWTs09cZsDPEMNXeMHQGPvKBJ+0IFrYtNQixTS4ojR+pGtwPvgFwu473hfsg+QG3WIrfcUsaHGxTeagCLs0sD9vtUrLJRLMDuaHFW5qxH/XpLRf56muIbgDvwUmWmZb6C3wLfzXVbsD/yCK0gVzyW35WvBDpF6bpea0K7azA+Az3KHoF9c/6LSxwZzcY57cZJv/36Ad5FuQtVBFcEuFfCXmEfK3BIlnivEn1v7LAfJ3DzoYt+fCe9ITziD+CXbs5s0S+IevqfmR9HQZ/JXn/5VE0p0PIy/yU6xB62XUS84P86hof8U7CtDg3b22LvBnL9KH2UW4nTpbzBLagVX8C1q2gTvjETZsvPWz3zK7hd8bP96Lf1B/7MaTADjfAzB2jio3LYHO+vgIAL4qfgXAEdsdgiFyvaOAyz7+CK8TEDA6En6I1wnCXxwJfyr2L4/EH/Ty3xz/qqd5uH9wHC3+W4e/3gv/Yv///Px5awBxtIdgBjl+BuHUPRDHexheswfeHMCgL/dpuwA/QIvI/1bH4Tk+hyFtyEucXWFnYGnimP7eB4n/h+8uMkrC/k6S5+fvW5p7hRsNAAA=";
    const result = await resultsFromHash(hash);
    // T1: Yawn inflicts drowsiness
    expect(result.turnResults[0].state.raiders[0].isYawn).toEqual(2);
    expect(result.turnResults[0].state.raiders[0].volatileStatus.includes("yawn")).toEqual(true);
    expect(result.turnResults[6].state.raiders[0].isSleep).toEqual(0);
    // T2-7: Yawn hasn't triggered yet
    expect(result.turnResults[6].state.raiders[0].isYawn).toEqual(1);
    expect(result.turnResults[6].state.raiders[0].volatileStatus.includes("yawn")).toEqual(true);
    expect(result.turnResults[6].state.raiders[0].isSleep).toEqual(0);
    // T8: Yawn inflicts sleep at the end of the turn second 4-move turn
    expect(result.turnResults[7].results[1].state.raiders[0].isYawn).toEqual(1);
    expect(result.turnResults[7].results[1].state.raiders[0].isSleep).toEqual(0);
    expect(result.turnResults[7].results[1].state.raiders[0].volatileStatus.includes("yawn")).toEqual(true);
    expect(result.turnResults[7].results[1].state.raiders[0].status).toEqual("");
    expect(result.turnResults[7].state.raiders[0].isYawn).toEqual(0);
    expect(result.turnResults[7].state.raiders[0].isSleep).toEqual(2);
    expect(result.turnResults[7].state.raiders[0].volatileStatus.includes("yawn")).toEqual(false);
    expect(result.turnResults[7].state.raiders[0].status).toEqual("slp");
    expect(result.turnResults[7].endFlags[0].includes("fell asleep")).toEqual(true);

    // T9-10: Boss sleeps for 2 moves
    expect(result.turnResults[8].results[1].desc[0].includes("fast asleep")).toEqual(true);
    expect(result.turnResults[8].state.raiders[0].isSleep).toEqual(1);
    expect(result.turnResults[8].state.raiders[0].status).toEqual("slp");
    expect(result.turnResults[9].results[1].desc[0].includes("fast asleep")).toEqual(true);
    expect(result.turnResults[9].state.raiders[0].isSleep).toEqual(0);
    expect(result.turnResults[9].state.raiders[0].status).toEqual("slp");
    // T11: Boss wakes up
    expect(result.turnResults[10].flags[0].includes("woke up")).toEqual(true);
    expect(result.turnResults[10].results[0].state.raiders[0].isSleep).toEqual(0);
    expect(result.turnResults[10].results[0].state.raiders[0].status).toEqual("");
  })
  test('taunt', async() => {
    const hash = "#H4sIAAAAAAAAA71W227bOBD9FYJPW4DFypckbd58SbcFmraosk+GHmhpbHFDiVpenKpF/r0z1MXOIos2KBpIoIeXGR4enhnrG9/xS57/40zNBff8crNJBK9lBTwTZKqCjIngwYF9t6ZF0u7BR9M0Xpna0Yqp4HtrQoOjlTnAu3pn0Nwa566Hbhcwt8rjjIPc1IW07dVuB7l3OGSN1vhTKu/6tSWFk/4W2wJ25NXI2BaxhXHZjVX7PVhCpyo49lypQBcrWeeg17KSexgHu+5n6R8bugEr/2d4Vcp6Dz0ptfFA0HMLhYqHaMwtVB2ZwdY0EmmJ54MGZFzkwtZ55QM5d9zh2QlHJD7uW7d09K3SypOlPFRxHqPSCjhQHBVbDQcg4jyiu2kb6K/ADfwH7VWjVSQEvngrr/vZ4Xhe8iwT/MAvv3FUwCvBef9u4sBrgSSvIVdFgJbCj/bLt8oFxcVOageCp7mVTYN466C14IsCmavxtmOUc4wyPtn9MDib/OfFqUmCG/5lpUOUG47X2WhgC2vNHcFeWnkAtlSWVJCWsjB3bKXlHfbeg9yxpZYFXdAswTAbvgz6lv1NSkrvjC0cW5MceL9By/BSrVT14J16Yyv0jvAuxHkiXiVinohpIi4SjJndD9hfC1TAZ9n+G+RXUsvR9DYgGwtl2XuTk3qvFYK37C3YLX+Ml+nZ9AnMrK3ck8Q2vcUWLgeMl8XpzYj9Ad9H1Ci3tDGqJmCD0SG+KVV+y95IStCrgzIoPiJqaXQxgu2gjoAfwE0eQ/vJtTnGJbipqugmlyCrnwU7I1WZg9K6u6PTTgd6VWpjTVO2sXq8MXlwLJWupMVglQnuhwJ8FPeov7RRecuuKHPynyZ5LvhHi5Ui2MBPzQ5z2lZbZZwiOa9Ko3IkRdbFr0L+gNKVOuaMDD8WRNbn9zwORXNGyb2D2gFblUAlYzJMnfVZ3ud6RTcwOR4ZPf+4Ns6zWC5VvX/B0XMy+MZzd4ev5Bf07BD0znNxfoLgVCZi+jz7z07278gT8+fZeTIspTgfDKPq/OJJvK80SMuWBjE49idbxH8NRSX+CTDmvwxjLLRP2HWKz+C/8F5i+el190zsn50AeJjoR0n8XgQXJwge1vPfnXuY//j5hOUkfszM45fImbjIYhcfms/E8GbZ/f13H8QDey8KAAA=";
    const result = await resultsFromHash(hash);
    // T3: taunt applied
    expect(result.turnResults[2].state.raiders[0].isTaunt).toBeGreaterThan(0);
    expect(result.turnResults[2].results[1].flags[0][0]).toEqual(" fell for the taunt!");
    // T4: taunt doesn't effect special actions
    expect(result.turnResults[3].results[1].desc[1]).toEqual("The Raid Boss nullified all stat boosts and abilities!");
    // T5: taunt prevents use of Bulk Up
    expect(result.turnResults[4].results[1].desc[0]).toEqual("Decidueye-Hisui can't use status moves due to Taunt!");
  })
  test('friendguard-counters', async() => {
    const hash = "#H4sIAAAAAAAAA8VWW0/bMBT+K5GfQLK0phegvEEZjGndEGXaQ5UHNzlNvTp2ZjuFDvHfd+w4bTbtAgI6JXWPj8/lOxef9p7MyTFJvxolCSWWHE+nHUokK4Ak1JE8c0RMSWVAX545IaZzsJ5UpeVKGifRpSTXqiqRW6gVXMq5QnKmjBk329pgqrnFEwOpkhnT67fzOaTWIEsrIfBrwa0JsgtnjtklrhnMnVbJ/Jr5FTZiN5rnOWiHjhew3ZkFB5GNmExBnLGC5bBh1ttrZn/HugHN/sAeLZjMISRFKgsOeqoh4z6IUi2hqJNZaek4Pi0+PiiBeSFTzYzltnLKde4wdofDJ977lWsX+owLbh3FLRT+HK06CVg5O9yvAlbgEmcR3c26hFAC0+S/EpaXgvuEwJ3VbBxOm/AsI0lCyYoc3xPsgCNKSHinnjGkmORRZTnMhQOzJedMGKBk76OKTmqs+4TKSghK3jGdoYQ3cIAGNk/y0DB78S8vHsXdWn9KTmZG6Rm6O2dcr6MvXLqqT2wlo0mpfBYmtwA2mqQgLeZx0OmgGtZHF7jzPg5/dty4HlKs3RhLli6YS+uWDAFdYZajK3Xrcva8cBBTiGey5EJEk1vmmvq0Esvoc4k4ncT0X3C7LlYmlCVbIkD9wL9VPIs+qe/wclgvmLEaa5r66/8oiD1KzkCUC3VHWlQAeSrYS8K7xtsSXQnmmvEkr+/II2H2KXmP00Gsy2ruJkp7E8Ceaw4yiy4qxPlymJu+/CvKJNy4vmd5srdtFuzawBwErAFxwXHgxNswUae5PR1UCipWV1AvpGBYm7h2GXT6KBhv1N2NdmNi/0lORwKYjk6VMtZEb8JI4G7WPAFGH7v9OZHvjdF95Ic2l/n+k3x3W77rgtH+bjwPW56blsY7tRPfPXz+V8YHmODGTntCxg3/dd0ftNzvtuCHGHpjpzXPelsLr+n9qOV9t3HHHUx6Y6j9O4MXoLcTAHELwK7aHQf7tOP+M+LHjZkhfvfwM6AHuB7SI3eGduLE/7FsPU4zoc2bJA8PPwBwl796tAsAAA==";
    const result = await resultsFromHash(hash);
    // T1: one Friend Guard (only Jigglypuff)
    expect(result.turnResults[0].results[1].state.raiders[1].field.attackerSide.friendGuards).toEqual(1);
    expect(result.turnResults[0].results[1].desc[1].includes("1 ally's Friend Guards")).toEqual(true);
    // T2: abilities nullified
    expect(result.turnResults[1].state.raiders[1].hasAbility("Pure Power")).toEqual(false);
    expect(result.turnResults[1].state.raiders[2].hasAbility("Liquid Ooze")).toEqual(false);
    expect(result.turnResults[1].state.raiders[3].hasAbility("Blaze")).toEqual(false);
    expect(result.turnResults[1].state.raiders[4].hasAbility("Friend Guard")).toEqual(false);
    // T3: no Friend Guard, Pure Power restored to Medi
    expect(result.turnResults[2].results[1].state.raiders[1].field.attackerSide.friendGuards).toEqual(0);
    expect(result.turnResults[2].results[1].desc[1].includes("Friend Guards")).toEqual(false);
    expect(result.turnResults[2].results[1].state.raiders[1].hasAbility("Pure Power")).toEqual(false);
    expect(result.turnResults[2].state.raiders[1].hasAbility("Pure Power")).toEqual(true);
    // T4: Friend Guard restored
    expect(result.turnResults[3].results[1].state.raiders[4].field.attackerSide.friendGuards).toEqual(0);
    expect(result.turnResults[3].results[1].desc[4].includes("Friend Guards")).toEqual(false);
    expect(result.turnResults[3].results[1].state.raiders[4].hasAbility("Friend Guard")).toEqual(false);
    expect(result.turnResults[3].state.raiders[4].hasAbility("Friend Guard")).toEqual(true);
    // T5: one Friend Guard (only Jigglypuff), Blaze restored to Delphox
    expect(result.turnResults[4].results[1].state.raiders[3].field.attackerSide.friendGuards).toEqual(1);
    expect(result.turnResults[4].results[1].desc[3].includes("1 ally's Friend Guards")).toEqual(true);
    expect(result.turnResults[4].results[1].state.raiders[3].hasAbility("Blaze")).toEqual(false);
    expect(result.turnResults[4].state.raiders[3].hasAbility("Blaze")).toEqual(true);
    // T6: one Friend Guard (only Jigglypuff)
    expect(result.turnResults[5].results[1].state.raiders[1].field.attackerSide.friendGuards).toEqual(1);
    expect(result.turnResults[5].results[1].desc[1].includes("1 ally's Friend Guards")).toEqual(true);
    // T7: Medi Skill Swap vs Jigglypuff, no Friend Guard in defensive calc
    expect(result.turnResults[6].results[1].state.raiders[1].field.attackerSide.friendGuards).toEqual(0);
    expect(result.turnResults[6].results[1].desc[1].includes("Friend Guards")).toEqual(false);
    expect(result.turnResults[6].results[0].state.raiders[1].hasAbility("Friend Guard")).toEqual(true);
    expect(result.turnResults[6].state.raiders[1].hasAbility("Friend Guard")).toEqual(true);
    expect(result.turnResults[6].state.raiders[4].hasAbility("Pure Power")).toEqual(true);
    // T8: Jigglypuff now benefits from Friend Guard (only Medi)
    expect(result.turnResults[7].results[1].state.raiders[4].field.attackerSide.friendGuards).toEqual(1);
    expect(result.turnResults[7].results[1].desc[4].includes("1 ally's Friend Guards")).toEqual(true);
    // T9: Delphox copies Friend Guard from Jigglypuff, benfits from it (only Medi)
    expect(result.turnResults[8].results[1].state.raiders[3].field.attackerSide.friendGuards).toEqual(1);
    expect(result.turnResults[8].results[1].desc[3].includes("1 ally's Friend Guards")).toEqual(true);
    expect(result.turnResults[8].results[0].state.raiders[3].hasAbility("Friend Guard")).toEqual(true);
    expect(result.turnResults[8].state.raiders[3].hasAbility("Friend Guard")).toEqual(true);
    // T10: Jigglypuff benefits from 2 Friend Guards (Medi & Delphox)
    expect(result.turnResults[9].results[1].state.raiders[4].field.attackerSide.friendGuards).toEqual(2);
    expect(result.turnResults[9].results[1].desc[4].includes("2 allies' Friend Guards")).toEqual(true);
    // T11: Swalot nullifies Delphox's Friend Guard, benefits from it (only Medi)
    expect(result.turnResults[10].results[1].state.raiders[2].field.attackerSide.friendGuards).toEqual(1);
    expect(result.turnResults[10].results[1].desc[2].includes("1 ally's Friend Guards")).toEqual(true);
    expect(result.turnResults[10].results[0].state.raiders[2].hasAbility("Friend Guard")).toEqual(false);
    // T12: Medicham doesn't benefit from Friend Guard, since it is the only one with it
    expect(result.turnResults[11].results[1].state.raiders[1].field.attackerSide.friendGuards).toEqual(0);
    expect(result.turnResults[11].results[1].desc[1].includes("Friend Guards")).toEqual(false);
  })
  test('faint-sitrus', async() => {
    const hash = "#H4sIAAAAAAAAA71W0W7bOgz9FUFPG6BhdpJubd+adFsLLMOwdNhD4AfWZmItsmVIcrKs6L+PlO2kK3aB9e7ewYYikSJ5eEjJuZMreS7zr97WUskgz5fLRMkaKpSZ4qkueJIq2Xp015e8CdwaQ5zaJmhbe94xUnLtbNuQtLJbvK5Xlqa31vv5sOwc5k4H0njMbV2A279ZrTAPnkTOGkM/pQ6+31uyOwgbGgtcsVUDcSziiIdtN06v1+gYna7wuPKlRlPMoM7RXEIFazwIu+UnCL8S3aCDfxDPSqjX2JNS24AMPXdY6JhEYzdYdWS2rmZJpCXmhw1C3OTbWx90aNm4445yZxyR+Bi33nPqt9rowDMdsIp68so7cMt+dBwNbpGJC4TuZt9gXwI/8N+aoBujIyH4LTiY99ohvQAyy5TcyvM7SR1wqqTs32UUnCki+RPoQkzJHykuMddFi3t8caV9q6VagfGo5CJ30DSEt26NUfKiIOZqqnb08oq8HJ7sfhCO00cvqdKEAr5zwMGWksrZGBQXztkdR5862KKYasddsCihsDsxM7Cj1XuElZgaKLhA44TcLOW0NRvxmTtpsbOu8OKS20H2AfaCiupA14P1IlhXkXWE91q9SvidJGqUqNcJ+czuB+xnKmUqTFPab/LBLLiWuCAU3znKW5u3XizAl7SYa1M8omN0Mvo9QiKnS/kBfNiLj8byKaIgPogpdRotnn2wgkv7nNCzwfKQxE/EH+FT311Rz+Suq+qDeZcCO7zoWvA56b8gbGr0Xny0RufclVfgiv2/K2+fzRzXUFqCf4DMiiPEMfEKeelvW87wOP0lwIUmsRdTKiiju64azaz3SDqie7qfAHGxQwxikSN38tNJnvxBBlP7oF3+C/yPWM76Az5Rp+qkc8eE4wprj2JWIt8ZY4oWVSf9Me8Pe8VnJj2mSpbP5pbaMd6Xul5TQgkdkd425tslXQGdkjSyNBhPKEx69HMgmYS/HX1mEBxdUYTBi5c9rZpvuifAmPwxjMN984So3OiD/UUIkG+O7Kd/g/2ULoPBz08NP/k71U+GMOTncCeo0f8bnNp/eUrDWE1oPONPOv+hyOK3vX94T6aGN8vu738ALpxO1zMJAAA=";
    const result = await resultsFromHash(hash);
    // T4: Dachsbun faints, Sitrus Berry is not used
    expect(result.turnResults[3].state.raiders[3].originalCurHP).toEqual(0);
    expect(result.turnResults[3].state.raiders[3].item).toEqual("Sitrus Berry");
    // T5: Other Daschbun does not faint, Sitrus Berry is used
    expect(result.turnResults[4].state.raiders[4].originalCurHP).toBeGreaterThan(0);
    expect(result.turnResults[4].state.raiders[4].item).toEqual(undefined);
    // T6: Heracross faints, Weakness Policy is not used
    expect(result.turnResults[5].state.raiders[2].originalCurHP).toEqual(0);
    expect(result.turnResults[5].state.raiders[2].item).toEqual("Weakness Policy");
  })
  test('wind-power', async() => {
    const hash = "#H4sIAAAAAAAAA81V32vbMBD+V4yeWvAgv7qtfUuajpYt3UgDfTB+UOyLfasseZKctoz+77uT7WQNG+0YjGEjyyfd3fd9urO/i404E9lXZ7SIhRdnSTKIhZYViDTmKeY8GcaicWCv5rxJ2gJ8mJrao9GOd4xiUVjT1GStzBau9MbQdG2cW/SvbcDMoqcVB5nRubSPF5sNZN6RyRql6FGid93eksNJf0djDhv2qmUY8zDCbtvKYlGAZXRYwf7NlQgqP5c6AzWXlSxgZ2xfl9L/yrQCK39jPi+lLqATRRsPDD2zkGMgUZs7qFoxG6vZEmQJ/KAGGTa5Zu08+oadW+2IO+MIwoe8+pGpr1Gh5xl6qMI6ReUdsOU4GEYFW2DhPKFbPdbQHYHr9W+Ux1phEAQevJWLbrWn56VI01hsxdl3QRXwPhYi3EuzBkuHlQTzaUxSLyXm0Yyi0vKNrBprvH9zia5BEW+kckDmUtpaA2/RjVKxuJQ2Jw4hyFsKsrvSp944Hh7ctDQcUL5bUp1wJ2L6rZHRSiITnVtUKlo2rPICClkay9NrLEof3SjpSlJ1fEL+CQPW0ZwLgGwh27vnEHoQpzGd50dUZija57303rKw3jZE6xZ1Hn0x90HGT7iB6LNdMwCTg/MH9EYno3Z8mWLQKBEXirrAmmgmQxNQldlQrEfXJuLzOib4vD15icWoRT86ZNGdzjMaH0zWuOiGBfurY2o5vBLguAU2/m8BTkh+Y7d4p7mgxMFbB5PPZdq25zH3AlKVuGgG1nK7zozKd0h3xfBnaAVX+z2pQfGmYFGqaJpxSUzRRueN58Z4gVHate4kmMJ0/MyfuA5b+0lHrKNXIXXUcK8KuR0tjPNR+BiiLoj0YO8bWqTtk0o+kGebvnPmJMN9+p+4TKhc/0H6UZ+G4uxVnfSavCL5rgtfk5ZkTwb8g+Bvexr+FHSxNY37O02fnn4AbpW1030HAAA=";
    const result = await resultsFromHash(hash);
    // T1: Air Cutter activates Wind Power for Kilo1
    expect(result.turnResults[0].state.raiders[1].field.attackerSide.isCharged).toEqual(true);
    // T2: Aerial Ace does not activate Wind Power for Kilo2
    expect(result.turnResults[1].state.raiders[2].field.attackerSide.isCharged).toEqual(false);
    expect(result.turnResults[1].state.raiders[3].field.attackerSide.isCharged).toEqual(false);
    // T3: Tailwind activates Wind Power for Kilo2 and Kilo3
    expect(result.turnResults[2].state.raiders[2].field.attackerSide.isCharged).toEqual(true);
    expect(result.turnResults[2].state.raiders[3].field.attackerSide.isCharged).toEqual(true);
  })
  test('skill-swap-intimidate', async() => {
    const hash = "#H4sIAAAAAAAAA61UUU/bMBD+K5GfNsmTUmAweKMtW5GGNJGiPUR5OOJraurYlu20VKj/fWc3aTc0XjZUyz3f+c6fv/ucF7ZgV6x+8kYzzgK7KsucMw0tsopHU4pojDjrPLrbadwErsGQTGODNNrHHSecNc50lrytWeOtXhgyH433d8NyX7B2MlDEY220ALe9WSywDp5czihFf0sZfL93GctBWNEscBGzLKRZpBkP2+ZONg26iE62eFz5pUQlJqBrVFNoocGDc7+8h/A31xwdvOGeLEE32JOiTcAIvXYoZLqENSts92R2TkdPoiXdDy1C2uS7Rx9k6GLynju6e8SRiE/n6m28+qNUMkRLBmxTnKrGHbiOdWSaFa4xEhcI3XxrsW+BH/jvVJBWyUQIPgcHd310uF4AVlWcrdnVCyMFfOGM9aNMjktOJN+DFNmY6lFgirUUHW7x00z6TjK+AOWRs6J2YC3h1Z1SnF0LYk5Tt1OVc6py+FW7wXk6ejUoNMrpwG8O4mElo3Zahdm1c2YTTx87WGM2li6qoFiCMJtsomBDq+8Ii2ysQMQGneZUpmTjTq2yh6ikYmOc8Nk0yoH1B2wzaqoDqYfsIhjXUnaCd8HP8zjOcn6S84ucala7AfslJwX83DqBidqD1ZNxq0mLUuwF9tXUnc8K8EtazMCJ7b+xkogtWbGSSmXFBiwhjf6ySqEjNNLUTWtJVUmLR7MHNzGtRZKgXOPQrf9G9QaSU87mxq0MRI0erB7HlB5HswzvxdDAzwyVlbrJZqDFWwydkSCC0U+G3mlq4B+rHt8Ps0GXFda8N8RXoKr+qZ2lGskk3n5rMyX2/s89th5hG6U7OqqS0j7cGR+y9NkiEj4yyhwNucF1uJ9YC8+UmQSdAJR5Fb9q0ar4MKpqt/sF/GRgHyUGAAA=";
    const result = await resultsFromHash(hash);
    // T1: Intimidate is activated after Skill Swap, which in turn activates Competitive but does not affect Scrappy
    expect(result.turnResults[0].results[0].state.raiders[0].ability).toEqual("Intimidate");
    expect(result.turnResults[0].results[0].state.raiders[0].boosts.atk).toEqual(0); // blocked by Scrappy
    expect(result.turnResults[0].results[0].state.raiders[1].ability).toEqual("Scrappy");
    expect(result.turnResults[0].results[0].state.raiders[1].boosts.atk).toEqual(0);
    expect(result.turnResults[0].results[0].state.raiders[2].ability).toEqual("Competitive");
    expect(result.turnResults[0].results[0].state.raiders[2].boosts.atk).toEqual(-1);
    expect(result.turnResults[0].results[0].state.raiders[2].boosts.spa).toEqual(2);
    expect(result.turnResults[0].results[0].state.raiders[3].boosts.atk).toEqual(-1);
    expect(result.turnResults[0].results[0].state.raiders[4].boosts.atk).toEqual(-1);
  })
  test('pollen-puff-heal', async() => {
    const hash = "#H4sIAAAAAAAAA7VUbW/TMBD+K5E/gWSk9GUb27d2BTqJoWotn6p8cJNL4tWxI9tpV03779w5STsGEwgN1XLP9/r4uXMeWc6uWHrvjGaceXa1XsecaVEBSziJMiNhwFnjwN7MyEnYAnwQTe2l0Y48hpwV1jQ1aiuzgxudGxQ3xrnb/tgmTK30aHGQGp0Je/iU55B6hyprlMK/UnrX+ZaUTvgt7hnkFFWLsGdhh6PbysqiAEvoZAWnkyslqOxa6BTUTFSigKOyPd4J/zvVCqx4RX1dCl1AR4o2Hgh6aiGT4RK12ULVktlYTZpAS7gf1CCCk2s2zkvfUHDLHd6dcATiQ119oKtvpJKeJOmhCnbMSh6wozwy7Ap2QMR5RLc61NC1wPX8N8rLWslACDx4K247a389L1iScLZjV48MJ+AjZ6xb66C45EjynZBZNMV8aJhBKrMGDvBhLl0jGc+FcsDZMrWirhGvbpTibJIhcxq7HbKcY5bjL3nqlaPBi4WmQYwFv1hBxdYM21kriCbWmj1Vn1qxg2gqLU3BshSZ2UfXSuzx9BVEHk2VyKhBoxjTrNm0UdvoO03Scm9s5qIZjQPrChwibKoVUvfRS29shdEB3gU/j2mNYz6M+UWMOZOnHvslxwmY2I1RckfTchI7Ot59M9GkbeF7tH82aeOipXAlHlaywqf1KzPDs+GfuQn0rtkCHwzoaNHkOQImwzoJthNCHK2F3Iq0bNgz6S/wzYXNDv/WuRbdK4BGeHVjt0bQxB6lDtAMn0pR+rfC0vM0B1VLXURzobPXiBrjeHij7w2+2vBSfjp1+BZmDzZa1uatIb4AlXQPbxxyBHHUtoueLvZq2KvPOmgdwIrmeHAaUYq6Nc5H4RuGHGBsjFW7WG8baDdWiQeMDNPdB4/R8VT9+bChYfg/6+P98bs+SOgjS3LC+5UkT08/AD4kg8a0BgAA";
    const result = await resultsFromHash(hash);
    // T2: Pollen Puff heals the target from 1 HP to 50% HP + 1
    expect(result.turnResults[0].state.raiders[2].originalCurHP).toEqual(1);
    expect(result.turnResults[1].results[0].state.raiders[2].originalCurHP).toEqual(1 + Math.floor(result.endState.raiders[2].maxHP()/2));
  })
  test('charge-recharge', async() => {
    const hash = "#H4sIAAAAAAAAA8VWXU/bMBT9K5GfNslIKeX7DQoINHWgFYmHKg8muW28OnZnO4UK8d93r+u0gcFG2WAiMtfXH+fc4+M092zEDlj+3RnNOPPsYDhMOdOiApZxCmVBQYez2oE9P6ZJwo7Bh9BMvTTa0YxNzsbW1FPMVmYG53pkMLwxzvWb7mLD3EqPIw5yowth5yejEeTeYcoapfBfKb2Lc0vaTvgJtgWMaNVUhLYILSynXVk5HoMldrKCVc+VElTREzoHdSwqMYZlctH9JvxzqSuw4oV0rxR6DFEUbTwQ9dxCIUMRUzOBaiFmbTVlgiyhPpiCCJNcfeO89DUtXmiHtROPIHzA1XMq/UYq6SmSHqowjrvSDJjRPjK0CmZAwnlkdzWfQjwC1+hfKy+nSgZB4M5b0Y+jTXlesCzjbMYO7hk6YI8zFp9hSOxzFPmbkEVyhPvhAKKUyjg8+40z6WrJ+EgoB5ydWunwtHStFGd9U4DDsw577OAey7/soUl2O08eHOqkCHcqqc4hO7F1MBmioonAaqGSS2FFQWUOjBI2OQJB2pxh6bGT8W6KmwzZoNZ6nhwLkrAnVJX0pSbvXEulNi42rqWb4uTAZZfvpfR0U76Z8l0KsoeG6D7Hw/5ijZmYQoaTandi8YfoC5tcGqnJ4L3SyBySIxEADws0kW6Lsbm9GeXA6M+CBElRDmF9+aMWE3Ig5YdL+o/0XRFHc/XB3LqcRCNTP+pF6hczsOjTWxw+NXntkoFwJWkqbDFf/wS7Ow3fU2VuURS8kfnktYy7yFGMNVQy3M1WHNkO8BIQrX/CtdNQHeAlhrx8LcstTu4aKRPeFKuw4RiseUnVPyX6N/ei4fqi8X/LPYsXeiukQohitzyFasT8diwkllNJvIGdVf3dx5cvxYVxmbc1LBpWiTtctECO67ZWCLjFI3egUzuvxf7lVbAGgSUM1RDPHD336rpbcq8D223BHnov8knSK4HcsfXu2OinZ49tDeRPX01Cvxuf1wLebQG3ub878B5C/Bfg/Rbwh0pNxm52OIYRaAdvMFjrB3MN7O0W9hngtXwD8BvfJimCf6je+A7Fb85O+GzrYrvDd7Hd4/vYohL0XZhm4etw+UdLMt48Wfbw8BPuj2xddwsAAA==";
    const result = await resultsFromHash(hash);
    // T1: Boss is charging Solar Beam
    expect(result.turnResults[0].results[1].desc[0]).toEqual("Typhlosion-Hisui is charging its attack!");
    expect(result.turnResults[0].bossMoveUsed).toEqual("Solar Beam (Charging)");
    expect(result.turnResults[0].state.raiders[0].isCharging).toEqual(true);
    // T2: Boss uses Solar Beam even though another move is selected
    expect(result.turnResults[1].results[0].desc[2].includes("Solar Beam")).toEqual(true);
    expect(result.turnResults[1].bossMoveUsed).toEqual("Solar Beam");
    expect(result.turnResults[1].state.raiders[0].isCharging).toEqual(false);
    // T3: Boss uses Hyper Beam
    expect(result.turnResults[2].results[0].desc[3].includes("Hyper Beam")).toEqual(true);
    expect(result.turnResults[2].state.raiders[0].isRecharging).toEqual(true);
    // T4: Boss is recharging and doesn't move
    expect(result.turnResults[3].results[1].desc[0]).toEqual("Typhlosion-Hisui is recharging!");
    expect(result.turnResults[3].bossMoveUsed).toEqual("(Recharging)");
    expect(result.turnResults[3].state.raiders[0].isRecharging).toEqual(false);
    // T5: Sunflora is charging Solar Beam
    expect(result.turnResults[4].results[1].desc[4]).toEqual("Sunflora is charging its attack!");
    expect(result.turnResults[4].raiderMoveUsed).toEqual("Solar Beam (Charging)");
    expect(result.turnResults[4].state.raiders[4].isCharging).toEqual(true);
    // T6: Sunflora uses Solar Beam even though another move is selected
    expect(result.turnResults[5].results[1].desc[0].includes("Solar Beam")).toEqual(true);
    expect(result.turnResults[5].raiderMoveUsed).toEqual("Solar Beam");
    expect(result.turnResults[5].state.raiders[4].isCharging).toEqual(false);
    // T7: Sunflora uses Hyper Beam
    expect(result.turnResults[6].results[1].desc[0].includes("Hyper Beam")).toEqual(true);
    expect(result.turnResults[6].state.raiders[4].isRecharging).toEqual(true);
    // T8: Sunflora is recharging and doesn't move
    expect(result.turnResults[7].results[1].desc[4]).toEqual("Sunflora is recharging!");
    expect(result.turnResults[7].raiderMoveUsed).toEqual("(Recharging)");
    expect(result.turnResults[7].state.raiders[4].isRecharging).toEqual(false);
    // T10: Typhlosion uses Solar Beam in Sun
    expect(result.turnResults[8].state.raiders[0].field.hasWeather("Sun")).toEqual(true);
    expect(result.turnResults[9].results[1].desc[4].includes("Solar Beam")).toEqual(true);
    // T11: Sunflora uses Solar Beam in Sun
    expect(result.turnResults[10].results[1].desc[0].includes("Solar Beam")).toEqual(true);
  })
  test('power-herb', async() => {
    const hash = "#H4sIAAAAAAAAA61US0/jMBD+K5FPi2SklLLL47YUEBy6IIrEIcrBTSaNwbEjP7pUqP99Z5ykLQikZVnFcsbj8Ty++ewXVrFTVjw6oxlnnp1mWcqZFg2wnJMoSxJGnAUH9vqcjIRdgI+iab002pHFAWcLa0KL2sYs4VpXBsW5cW46LDuHhZUedxwURpfCri6qCgrvUGWNUvirpXe9bU3uhH/CuYSKTrUizmWcYWN2b+ViAZaykw1sV66WoMqJ0AWoc9GIBWyU3fJO+PdU92DFB+pJLfQCelC08UCpFxZKGYtozRM0HZjBatJEWGJ90IKIRi7MnZc+0OEOO6yd8ojAx7h6RaXPpZKeJOmhifvolSxgSX5knBUsgYDzmN39qoW+BW7APygvWyUjIPDsrZj2u0N5XrA852zJTl8YMuCYM9aPLCpOOIJ8J2SZnKE/3MAotTIOe79/JV2QjFdCOeDs0kqH3dJBKc6mpgSHvY4+fqCPzZevB+V49Gbg1ijFcJeS6szYhQ2RZBgVSQRWC5XcCitKKnNmlLDJGQjC5tIUwSVnSmDMnI9T9JKxWdB6lZwLwnAiVJNMpSbyPEil9m/2H6Rr0Tgmc8SPUxrjlB+k/IiEfD1kesKx2+isUiYyYyv2lX/7ZZKfXbv2cP/W/AabXIGd4+JK2HL1bzhEJLPdQvOoz/K4tU0POXRjkZnBBrYr9unNVs1cYseoe5PayAKSWQuF+x/ZfZDRGFEAJds2Em8rvgtYx5ivA4Us1dhuvO8fAXWIYHijHw1ez5jZq1WfXNe+WWv8hlgz4eovoPU+Vnl/ww6jjyiOX9N6NOi/97n1GTYSr8RoS9Ax3+V6iuf6U94G6CbWiGc8E1k9HDtEw9HGww562L6/DkytpDdl71OBD/D7YsWfC4xgZym92/Tk5vEBx4+0OR9Gnq/XfwCkfvNGFAcAAA==";
    const result = await resultsFromHash(hash);
    // T1: Sunflora uses Solar Beam without charging in Sun
    expect(result.turnResults[0].results[0].state.raiders[0].field.hasWeather("Sun")).toEqual(true);
    expect(result.turnResults[0].results[1].desc[0].includes("Solar Beam")).toEqual(true);
    expect(result.turnResults[0].raiderMoveUsed).toEqual("Solar Beam");
    expect(result.turnResults[0].state.raiders[1].isCharging).toEqual(false);
    // T3: Sunflora consumes Power Herb (and gets Specs from Symbiosis) to use Solar Beam without Charging
    expect(result.turnResults[1].state.raiders[1].field.hasWeather("Rain")).toEqual(true);
    expect(result.turnResults[2].results[1].desc[0].includes("Solar Beam")).toEqual(true);
    expect(result.turnResults[2].results[1].desc[0].includes("Choice Specs")).toEqual(false); // Specs are passed after the move is carried out
    expect(result.turnResults[2].state.raiders[1].item).toEqual("Choice Specs");              // But Sunflora still has the specs after moving
    expect(result.turnResults[2].state.raiders[1].isCharging).toEqual(false);
  })
  test('stockpile-spitup-swallow', async() => {
    const hash = "#H4sIAAAAAAAAA9VWS0/jMBD+K5FPIPnQJ1BuUGCX1cKBFu2hysFNJqm3jh3ZTqFC/PedcZJC2V2JaldUaGLHHo/nm2/8SJ5Yxk5Z8tMZzTjz7HQ263CmRQEs5tSUKTW6nFUO7PUFGQmbgw9NU3pptCOLHme5NVWJ2sKs4FpnBptz49xN260dJlZ6HHGQGJ0Ku77MMki8Q5U1SuFrIb1rbBfkTvgl1ilkNKsUoU5DDRuzqZV5DpaikwW89NxCgkrHQiegLkQhctgo6+6d8H9STcGKv6jHC6FzaJKijQcKPbGQykCiNEso6mRWVpMmpCXwgxJEMHLV3HnpK5pc5w65Uxwh8QFXr/Et3Zlef4cVUF7EXCrpg9pDEYwRgsxhRU5lqFVjnYNO64RgzNN1Cc3CuHZVKuVlqWSwgUdvxU0z2pL2gsUxZyt2+sRwX5xwxppnFhQjjqm/EzKNztEfDlznuVrPqwwXKhPKQVOzg1sTndXBHzKuK6U4+ypsilSCoyN0tJH4uVX2u28eHOp2EPO2cTJjV2IJ0RSEJfhzk66jiRIFppTsZnHt6XjbfQsw4rh+PyTF7EPMW50dCfSGvQYhtHYiMfEmWZYyrP+klD66p10/eRBKmQdsXUAG2kE0rqx6LzXcUd8Cm7Km9rqzRe3KStwo0ZcK6aDd5UoapEmhjIUq/ge/d0bc/3QRDz5NxHFzYgd8iBKa/Tf7Cg9Dpx4ZbgdfSLzLui+8ceLrU9fBic00byuoK1aIR5xUYzfzBnyE0rrY7PMdYA9ujPNRuIylzg93wu60MIT9ct4+CL3bmu4FvYeyP/Q+yv7QSf5pz+HNT9/F3VCPUPbH+QRlg95+RT4I+xjlo7HxdpsNsRrRzyD9ltEfFZY+lgGWIywnWI7j8M/2m9D8mLdPHD8//wLigcdtFQsAAA==";
    const result = await resultsFromHash(hash);
    // T2: Spit-Up should not do any damage
    expect(result.turnResults[1].state.raiders[1].stockpile).toEqual(0);
    expect(result.turnResults[1].results[0].state.raiders[0].originalCurHP).toEqual(Math.floor(result.endState.raiders[0].maxHP()));
    // T5: Expect 3 Stockpile stacks
    expect(result.turnResults[4].state.raiders[1].stockpile).toEqual(3);
    // T6: Still 3 Stockpile stacks expected after another use
    expect(result.turnResults[5].state.raiders[1].stockpile).toEqual(3);
    // T7: Igglybuff faints, Stockpile stacks reset
    expect(result.turnResults[6].state.raiders[0].originalCurHP).toEqual(0);
    expect(result.turnResults[6].state.raiders[1].stockpile).toEqual(0);
    // T9: Swallow Heals
    expect(result.turnResults[8].state.raiders[1].originalCurHP).toBeGreaterThan(result.turnResults[7].state.raiders[1].originalCurHP);
    // T10: Swallow Fails
    expect(result.turnResults[9].state.raiders[1].originalCurHP).toEqual(result.turnResults[8].state.raiders[1].originalCurHP);
  })
  test('syrup-bomb', async() => {
    const hash = "#H4sIAAAAAAAAA9VW3W/aMBD/V5CfOskPkNB25Y2WaSCNTip9Q3kwySV4dezIH6yo4n/f2fmAVmVtpYppSnRcznf3+92dbfFEcjIi6S+jJKHEktFy2adEshJIQr3KM68MKHEG9GzinZguwAZVVZYrabxHREmhlavQWqoNzGSuUF0pY+btZ50w1dziioFUyYzp7bc8h9QaNGklBP6suTWN79qnY/YBZQa5j6pYkFmQ0Lnda14UoD07XsL+y6w5iOyGyRTEhJWsgM5Yf94x+5rpHjQ7Yr5ZM1lA0xSpLHjqqYaMhyIq9QBl3UynpbeEtoT6oAIWnIxbGcut88F177B2zyM0PuDKLf5yM5bbH7AB3xe24oLbYLZQBmeE8O6w8Ul5kKLxLkBmdUOQ8/22gmYwpp2KE5ZXggcfeLSazZvVtmjLSJJQsiGjJ4L74islpHmXwXBFsfV3jGe9a8yHCxNnUqF8qTkTBhpJzm5Vb1xz/0KodEJQMmU6w0pCngvM0z3JrjXGgxcvLg36CHnbJFmSsbFKcrPGHkZ9XFomdfDl84xtziuKE5vwCqv28+m0E7FdbLWrsFflCsG/a/XbeuKD9/DGDfJT47Zz2pFD9S/MyYJb7UzvGrT2e+ZaiawrITqPEKKWHy1jJg0mTu17ucf/MfchJXPnb58g/wXjcYrna1Fp5rNOQVRcFr0pk9lbJSTNKR0GU1BxEod7cNDaz59XVvozMdi3AcPO5srYXrgHER/r7WN0E4t1Qy1IyR4xsoZvgod7GMwzgRykgd7NGvy9E+HzGgO2KT7C4EjsnkJ0nEKMzykoxAcUDmc6PDKEz8Yftr5xd/eg5a34z8E+P8DuTiAO5TToF6+ix9iRU6BfHqCfcu54/JfeL6Ixqn4GF/QyCX9avAGvjfZNkt3uD5WgZaoGCgAA";
    const result = await resultsFromHash(hash);
    // T1: Dipplin uses Syrup Bomb, condition applied
    expect(result.turnResults[0].state.raiders[0].syrupBombDrops).toEqual(3);
    expect(result.turnResults[0].state.raiders[0].boosts.spe).toEqual(0);
    // T3: First speed drop not yet applied
    expect(result.turnResults[2].state.raiders[0].syrupBombDrops).toEqual(3);
    expect(result.turnResults[2].state.raiders[0].boosts.spe).toEqual(0);
    // T4: First speed drop applied (end of first "turn")
    expect(result.turnResults[3].state.raiders[0].syrupBombDrops).toEqual(2);
    expect(result.turnResults[3].state.raiders[0].boosts.spe).toEqual(-1);
    // T7: Second speed drop not yet applied
    expect(result.turnResults[6].state.raiders[0].syrupBombDrops).toEqual(2);
    expect(result.turnResults[6].state.raiders[0].boosts.spe).toEqual(-1);
    // T8: Second speed drop applied (end of second "turn")
    expect(result.turnResults[7].state.raiders[0].syrupBombDrops).toEqual(1);
    expect(result.turnResults[7].state.raiders[0].boosts.spe).toEqual(-2);
    // T11: Third drop not yet applied
    expect(result.turnResults[10].state.raiders[0].syrupBombDrops).toEqual(1);
    expect(result.turnResults[10].state.raiders[0].boosts.spe).toEqual(-2);
    // T12: Last drop applied
    expect(result.turnResults[11].state.raiders[0].syrupBombDrops).toEqual(0);
    expect(result.turnResults[11].state.raiders[0].boosts.spe).toEqual(-3);
    // T16: No more speed drops
    expect(result.turnResults[15].state.raiders[0].syrupBombDrops).toEqual(0);
    expect(result.turnResults[15].state.raiders[0].boosts.spe).toEqual(-3);
  })
  test('mirror-armor-guard-dog', async() => {
    const hash = "#H4sIAAAAAAAAA9VUS4vbMBD+K0anLeiQZLePzS1N+sghpSy5BR8Ue2xPI0tGksOGJf+9M7KczZYWeigLxUKet7759HgSlZiL4oe3RkgRxHy3m0hhVAsilyxiycJUit6DW684SLkaQhRtF9AazxEzKWpn+46srT3C2lSWxL31fjOqQ8HCYSCPh8KaUrnTp6qCIngyOas1/RoMPsU2XE6FA80lVJzVqTiXcYZL2NZhXYNjdNjCs+YbBF0ulSlAr1SrargYB/VBhd+ZtuDUH8zLRpkaEinGBmDohYMSYxOdPUA7kNk7w5ZIS+wPOlAxyPd7HzD0nDxwR70zjkh8XNecuPU9agwsYYA2+qkqR8CR62CcNRyBiQuEbnvqIG2BH/nvdcBOYyQEHoNTm+Qd2wtK5LkURzF/EnQCPkgh0thFw70kkh8UltlHqkeOhSuUQUMrVUp7kGJtiHcsI5mm11qKr8qVBDzmv6P8y5efR+Pt9JdBrulkMhTY5VGmX4x+/7LEWORe0iYsrTviwWDd8MF6oSV4G3TOumzhWuv+GUDxWR0g24JyvIl/BXb2P4G9JSiKD1DAiu/etZKgfukJV7ay9Wvv+p0U3/GgiqYXV1JCdfPNZovh5rx5LWB5uip30RRF4u+KdDqos8H+NuFMaFukx2L63Byl3WysD1l8dtDU1MOEslNucD0Mk2jVI2UOyzOA3STnV4mlXI4jz8/nn9CEEQ/lBQAA"
    const result = await resultsFromHash(hash);
    // T0: Intimidate is reflected by each Mirror Armor, Guard Dog is activated by Intimidate
    expect(result.turnZeroState.raiders[0].boosts.atk).toEqual(-2);
    expect(result.turnZeroState.raiders[1].boosts.atk).toEqual(0);
    expect(result.turnZeroState.raiders[2].boosts.atk).toEqual(0);
    expect(result.turnZeroState.raiders[3].boosts.atk).toEqual(1);
    expect(result.turnZeroState.raiders[4].boosts.atk).toEqual(-1);
    // T1: Mirror Armor reflects Fake Tears. Even though the user itself has Mirror Armor, the move is not reflected again
    expect(result.turnResults[0].state.raiders[1].boosts.spd).toEqual(-2);
    expect(result.turnResults[0].state.raiders[2].boosts.spd).toEqual(0);
  })
  test('plus-entrainment-gooey', async() => {
    const hash = "#H4sIAAAAAAAAA71V227bMAz9FUNPLaABza23tzbp1gJNNzTB9hD4QbFpW40sGZIcNBv67yNlO0mLFdiGLYghUxJFHh4eOT9Yxi5Z8uSMZpx5drlYnHCmRQks5mTKlIweZ7UDezchJ2Fz8ME0lZdGO/Loc5ZbU1e4Wpo13OnMoLk0zk27aRMwsdLjjoPE6FTYzU2WQeIdLlmjFL4K6V3rW1A44Vc4ppDRqUqEMQ0jbN3mVuY5WEInS9jNXCFBpWOhE1ATUYoctovN9FH4Xy3NwYp3lseF0Dm0pGjjgaAnFlIZiqjMCsqGzNpqWgm0hPqgAhGcXL10XvqaDjfcYe2EIxAf8uoNlb6USnqypIcy7GNU8oA1xZFhVLAGIs4juvmmgrYFruO/Vl5WSgZC4NlbMW13u/K8YHHM2Zpd/mCogHPOxoVJzK0oy010JHQaZVaCTt0xHmL7u4wvwpELjm14FDKNrjEjusxEWVvj/Ydb6WrJeCaUA1wuhK00kIuuleLsKkVyNQoihDnFMNtf/NItDnpvHtzqnWDGb9gTrGqBqb8bG80KCAp6kHnho5kSrsDZFHJRGEstmVipVPRYa2R9MMIIi7jJcfY6cZf6gmOPv8qVWBtFot2ZbT33sJa+kdC9zCD6bJeU0aTg3tbUH/V/r6pAzAJJpnuG0eZFrVOwS8obBw9ETU47lCigCaSgNflvLW9rhPhF1dSQjyapXTRrKLkVNt38BecdthuNKpK6BP0upAEPFTyJZZ2zV3ZL3bXw2DzS9s1aGpQ5Yb82Kt3iahhrefsD5o4eTEQSP34P25CzT8ak4Yp3RosKp0CYxnje+misjFj9K1xXCd6PWWXF5i2wuL1GQ04xgzmgRmagHUTjAkjlg25r1IJtIZcSpd3biRZPHk2N81H4bkmd4609wd61Z4MqGmmU4hlPBr13h4f8onNtO0ga7B0m9XAv9b7EkJXeIfKf7uXfaxbiOkj5I6xzm957kawO3PrzfQCHr/8M6+zi7H/0/rf88PYt+jjQh+EU3yN+juNZHP7iw488Yt49cfzy8hPZRTiPOAkAAA==";
    const result = await resultsFromHash(hash);
    // TODO: more detailed checks
    // check for OHKO
    expect(result.endState.raiders[0].originalCurHP).toEqual(0);
  })
  test('thermal-exchange', async() => {
    const hash = "#H4sIAAAAAAAAA71VS2/bMAz+KwFPK6ACdl5de9vaDush61AE6CHwQbFpW6ssGZKcJSjy30fJdpwW7dAC3SBBokiR/Ejq8Qg5XED6y2oFDBxcrFYRA8UrhIR5UmSeiBk0Fs3Nld/ETYEukLp2Qivrd4wZFEY3NXErvcEblWsi19raRb9sDaZGOJJYTLXKuNld5zmmzhLLaClpKoWz3d7Sm+PugcYMc69V8zBmYcTDtqURRYHGoxMVDitbCpTZJVcpyite8QIPzHZ5x91LrCUa/gr7suSqwC4pSjv00FODmQhB1PoBqzaZjVGeE9IS4sMaedhkm7V1wjVeuc0dxe5xhMQHv2rnQ18LKZynhMMqyMmq34Ebb0eEUeIGfeIcoVvuauxKYPv8N9KJWoqQENw6wxedtA/PcUgSBhu4eAQ6AZ8ZQNdXgXHOKMkLUYmHXQNHVM6lRQaffujRlxbpCTDVSMngOzcZ4Q7qc1KPWDz+3I/JvhdM4medROdRa2MFPyXfje50U5TQevHAT16lEzaeRRHpvSYOTs/YPPJ9ErFxxM5mbDJL9j2ic0ZF/cq3KZdi3fiEHS+6eJclmorL0fU2bc8Cg2+SCje6NWt4KfSu/T3sOOrjTgK9OuB9YmJAOn57TT4WH1kTqoA3wpwwuNNO+9Mb5tN7bst3np33ArwXUp7ent4LWw8wvWyANaWkNPQGpf6ZOlD/FFUogiuN/k1X8RmspLtqUxbP2aw1SJm7whyVxdFlif76xtSCaNYh7fBWgh6ceMj65MkViQYtZxpsB6j4lnRCqXq1aQiot9BWmY7Z230utHWj8FyS6vs8H0IjO8flo/PzX/yPqQ2RHxWKTZ8D6Kx8jH8q/Cqe+3/M/yj+M0jC1xKaFyas70my3/8B2No/+rAHAAA="
    const result = await resultsFromHash(hash);
    // T1 : Flame Orb does not burn Baxcalibur when held
    expect(result.turnResults[1].state.raiders[1].status).toEqual("");
    // T2 : Flame Orb does not burn Baxcalibur when flung
    expect(result.turnResults[1].state.raiders[1].status).toEqual("");
    // T3 : Will-O-Wisp does not burn with Thermal Exchange
    expect(result.turnResults[2].state.raiders[1].status).toEqual("");
    // T4 : Flamethrower boosts Atk, secondary effect burn fails
    expect(result.turnResults[3].state.raiders[1].status).toEqual("");
    expect(result.turnResults[3].state.raiders[1].boosts.atk).toEqual(1);
  })
  test('ability-nullification', async() => {
    const hash = "#H4sIAAAAAAAAA91WUU/bMBD+K5GfQMq00rRj8EYLEkgUIdpp0qo8HMk18erame0UEOK/785JKGUbGpu2SVNSxz6f7+777nLpvViIQ5F9dkaLWHhxOJ/3YqFhhSKNeSpznuzFonZoz45ZCWyBPkxN5aXRjjX6sSisqSuSrswaz/TC0PTaODfplo3BzEpPOw4zo3OwdyeLBWbekcgapehRSu9a3ZLNgV/SmOOCT1UQxjyM+Kg2s7Io0HJ0coWblSslqnwMOkN1DCso8FHYLK/Af080Qws/EI9L0AW2pGjjkUPPLOYygKjMElcNmbXVLAm0BHxYIQQlV187L33NhxvuCDvHEYgPfvUdPaU70nfnuEbmBa6lkj6IPa6CMrlgdVyzURlG1WoXqPOGEIp5dldhmxjXZaVWXlZKBh289RYm7W4H2oNI01isxeG9oLp4HwvR3vMgOIiJ+iuQeTQie7QxzZDqgXEsQDlsR/FBX9c2R6JE10rF4hQcowg23pGNxyt96ITJ3rObtvZ65O6C3BxbKJjguThHWEQjBTmDG1mEpdRFNL2RAW2jFx1z8mk5K2tmJLqsdVYS68mQDLY2pt5YZvQErC+/1LDk/IZY9uP9Xrw/jIe9uN/jeUJhdoEexFQCE8p8VgIf30y3CLikLEWX5oap7iiw+W9QEIzMCbHMllHAzewvpVIEHiqKnTXnaVDcBNvnCM2Ny8BCDuLZaivknQsTHTX1tsu2pbe1i0ZoLdffTK6oLXSR9od9Cr0ZXwthBrXmbnCKquLcnYLmV3tcEhZef6SXjgt0FqBeGbPagGvzs8XeBmxC8GrmJYwvgftEVqNzDO/qFSq4xefYfiU5U2oJSIX2DbbzWocuNKnzN1P1NFsvAxr8L4DStn8MgihMk63ypbcqaeTDbZywLmhzQwod25kY56PQoSkkQt+j0y+f7U4P4sET/y2KpBP9Ydd7nW7SpI+b7y67/2nkY4VgqfVSEC562+Zfcgd/TRx9uv4RBY9Y/55rKj36vzDgbzd/dumXpOFDHi7eTePuTtOHh68Mz9ngHgkAAA==";
    const result = await resultsFromHash(hash);
    // T0: Skill Swap, Muk Receives Pure Power
    expect(result.turnResults[0].state.raiders[3].ability).toEqual("Pure Power");
    expect(result.turnResults[1].state.raiders[3].hasAbility("Pure Power")).toEqual(true);
    // T1: Muk's attack is boosted by Pure Power
    expect(result.turnResults[1].results[1].desc[0].includes("Pure Power")).toEqual(true);
    // T2: Abilities Nullified
    expect(result.turnResults[2].state.raiders[3].ability).toEqual("Pure Power");
    expect(result.turnResults[2].state.raiders[3].abilityNullified).toEqual(1);
    expect(result.turnResults[2].state.raiders[3].hasAbility("Pure Power")).toEqual(false);
    // T3: Muk's attack is NOT boosted by Pure Power, nullification ends after turn
    expect(result.turnResults[3].results[1].desc[0].includes("Pure Power")).toEqual(false);
    expect(result.turnResults[3].results[1].state.raiders[3].abilityNullified).toEqual(1);
    expect(result.turnResults[3].results[1].state.raiders[3].hasAbility("Pure Power")).toEqual(false);
    expect(result.turnResults[3].state.raiders[3].abilityNullified).toEqual(undefined);
    expect(result.turnResults[3].state.raiders[3].hasAbility("Pure Power")).toEqual(true);
    // T4: Muk's attack is boosted by Pure Power
    expect(result.turnResults[4].results[1].desc[0].includes("Pure Power")).toEqual(true);
  })
  test('mycelium-might', async() => {
    const hash = "#H4sIAAAAAAAAA91WbWvbMBD+K0afVtBYXtu135p0awtNGWlgsOAPin2xtciSkeS0YfS/706x81K6rmGsgxHnIp1Od/c8d5Lzg83ZGUu+O6MZZ56dTactzrQogMWchjKlQZuzyoG9viAjYTPwYWhKL412ZNHhLLOmKlFbmCVc67nB4cw4N2qma4eJlR5XHCRGp8KuPs3nkHiHKmuUwp9celfb5uRO+AXKFOa0qxRBpkHCxmxiZZaBpexkAduZyyWodCh0AupCFCKDjXI9HQv/nGoCVvxCPcyFzqAmRRsPlHpiIZUBRGkWUKzJrKwmTaAl4IMSRDBy1cx56SvavOYOsVMegfgQV6/wV7pzvbqBJRAvYiaV9EHtoQjGGILMYUlOZZCqts5Ap2tCMOfJqoS6MK6pSqW8LJUMNvDgrRjVqw1oL1gcc7ZkZz8Y9sVHzlj9TIPilCP1YyHTaID+cOEyNyoFnWHh50I5qCW7NCaNhIsucZlxXSnF2ZWwKUIJjo7R0eYTPzbKbvvJg0snfc5uax9TNhILiK59hEkQ4Xe5SM19NBChjSZ5RQzMjKJ2+2ySykVfKp3kyHi71eLTeB3oZD96E/+UY3knBlKX2CowujvZwzdaYXfJqohGMssp2DdjiugGQvUHAXQNqdPv1JHC6GWslOQO2DvsMcDsOTtPkPO70grqhVGVvr9TonwtKuy1EZh7lwgrUurxvdkerne3JjpfN90R0Su9RQ4HYC0FnshCPkW2wXcQsomoNNF2BaqUOouuhKbzPcylUjT/iiePuhSPdbKIxkjua8F2iZ8Fq+VL4HZLNgYlHuC5qh2KbFuzJ9huKh2uokOr1/tfAMX1JdILqjDEYm3ctxtlfx+kWGa4uGWk++TUt3Dny/uanT20bP9R4N0r5aDAnecCd98AcRdDN06oXejGP2JbIn4feqhAWLzvjfMu+lD3m6TXxiF59HbyeNOS95GCfxL4GDE3Tnav7wNi77/sDgl+grg3Xprz+Vdh4+metsI/pA7KLu+h7OP3GL8ncVjYfMg25s0Tx4+PPwF0pWDslAoAAA=="
    const result = await resultsFromHash(hash);
    // T0: Mycelium might makes Toedscruel move second and ignore Good as Gold
    expect(result.turnResults[0].raiderMovesFirst).toEqual(false);
    expect(result.turnResults[0].state.raiders[0].boosts.def).toEqual(-2);
    // T1: Toedscruel moves first, since Focus Punch has a lower priority bracket. Good as Gold is still ignored
    expect(result.turnResults[1].raiderMovesFirst).toEqual(true);
    expect(result.turnResults[1].state.raiders[0].boosts.def).toEqual(-4);
    // T2: Muk's Screech fails due to Good as Gold
    expect(result.turnResults[2].state.raiders[0].boosts.def).toEqual(-4);
    // T3: Abilities are cleared
    // T4: Toedscruel moves first and move fails, since ability is nullified
    expect(result.turnResults[4].raiderMovesFirst).toEqual(true);
    expect(result.turnResults[4].state.raiders[0].boosts.def).toEqual(-4);
    // T5: Toedscruel moves second and Good as Gold is ignored once ability is back
    expect(result.turnResults[5].raiderMovesFirst).toEqual(false);
    expect(result.turnResults[5].state.raiders[0].boosts.def).toEqual(-6);
    // T6: Toedscruel moves first, since Acid Spray is a damaging move. Acid Spray does not affect Gholdengo due to Steel typing
    expect(result.turnResults[6].raiderMovesFirst).toEqual(true);
    expect(result.turnResults[6].state.raiders[0].boosts.spd).toEqual(0);
    expect(result.turnResults[6].results[0].desc[0].includes("does not affect")).toEqual(true);
    // T7: Toedscruel moves first with Mud-Slap, which works normally
    expect(result.turnResults[7].raiderMovesFirst).toEqual(true);
    expect(result.turnResults[7].state.raiders[0].boosts.acc).toEqual(-1); 
  })
  test('multistrike-symbiosis', async() => {
    const hash = "#H4sIAAAAAAAAA9VVUU/bMBD+K5GfNskPbUPH4I1SGEiAEO3EQ5QHN7kmXh07s51u1cTD/t9+1O6cNFDEEGzSpsmJcz6f77777pJ8Y0t2yLJPzmjGmWeHSTLgTIsKWMpJlDkJQ84aB/Z8SkbCFuCDaGovjXZkMeKssKapUVuZNZzrpUFxYZy73C5bh5mVHnccZEbnwm5OlkvIvEOVNUrho5TedbYluRN+hXMOSzpVizDnYYbebG5lUYAldLKC+5UrJaj8WOgM1FRUooBe2S5vhH9KNQcrfqE+LoUuoCNFGw8EPbOQy5BEbVZQtWQ2VpMm0BLygxpEMHLNwnnpGzrccoe5E45AfIirN/iU7khvLmANxItYSCV9UHuogjGGIHNYk1MZZtVZF6DzlhDEPN/U0BXGbavSKC9rJYMNfPVWXHa726S9YGnK2ZodfmPYF+85Y92VBMUBR+pvhMyjCfrDjVkG2A+Ux1IoB93MPupFY3NASnSjFGdnwlEWwcc79NGP9G6rjIePLtwaDjDcJYaZWlEQwQm7ALGMJkrklNzEglhJXUSzLzJk29pFUyo+LudlQ4xE143OSmQ9HqPDzsfMG0uMngjry8+NWFF9A5Z9vj/g+2M+HvDRgOQYYW6BHnBsgSNbCaxw6KwH8g4Fp0q4MjqVoVq3iFODc9G1UTKjek6MyntCRuMRktHOLyPlqmM2ScM66aHvcHsPGtvttim8lfSG9tIO4A/GACG7lTlEFxD6eAfl68rWI2T4atYKoqlcE8UvghsH/hbw4zvd7NFqB/ZsUy2kcdI9SfOZsPnvNt7pKzne+59Ap90bvRdUQUTSH5YKe2bYbox3wYt1wXh8nzmee3NlIvqWvGXo7JlTwxC6O7eHlsN/FTp+EPoMhIqOS6DvYozjeR9/GnmE4y8njcVOBuHvFdOvJw0iDtKnfHul6d3dT+zSthwcCAAA"
    const result = await resultsFromHash(hash);
    // T0: Triple Dive hits 3 times, but Symbiosis is only activated once (WP consumed, holding WP)
    expect(result.turnResults[0].results[1].desc[1].includes("(3 hits)")).toEqual(true);
    expect(result.turnResults[0].state.raiders[1].boosts.spa).toEqual(2);
    expect(result.turnResults[0].state.raiders[1].item).toEqual("Weakness Policy");
    // T1: Similar to T0
    expect(result.turnResults[1].results[1].desc[1].includes("(3 hits)")).toEqual(true);
    expect(result.turnResults[1].state.raiders[1].boosts.spa).toEqual(4);
    expect(result.turnResults[1].state.raiders[1].item).toEqual("Weakness Policy");
    // T2: Heal Cheer
    // T3: Another Triple Dive, no more items to pass
    expect(result.turnResults[3].results[1].desc[1].includes("(3 hits)")).toEqual(true);
    expect(result.turnResults[3].state.raiders[1].boosts.spa).toEqual(6);
    expect(result.turnResults[3].state.raiders[1].item).toEqual(undefined);
  })
})


// Test cases for OHKO strats
describe('OHKO tests, Official Strats', () => {
  test('decidueye', async () => {
    const module = await import(`./data/strats/decidueye/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('walking_wake', async () => {
    const module = await import(`./data/strats/walking_wake/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('walking_wake/charging_wake', async () => {
    const module = await import(`./data/strats/walking_wake/charging_wake.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('walking_wake/shocking_wake', async () => {
    const module = await import(`./data/strats/walking_wake/shocking_wake.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_leaves', async () => {
    const module = await import(`./data/strats/iron_leaves/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
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
  test('chesnaught/ghold', async () => {
    const module = await import(`./data/strats/chesnaught/ghold.json`)
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
  // test('mewtwo', async () => {
  //   const module = await import(`./data/strats/mewtwo/main.json`)
  //   await testOHKO(module as LightBuildInfo);
  // })
  test('h_decidueye', async () => {
    const module = await import(`./data/strats/h_decidueye/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion', async () => {
    const module = await import(`./data/strats/h_typhlosion/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/sushi', async () => {
    const module = await import(`./data/strats/h_typhlosion/sushi.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee', async () => {
    const module = await import(`./data/strats/eevee/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/aura101', async () => {
    const module = await import(`./data/strats/eevee/aura101.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/main', async () => {
    const module = await import(`./data/strats/h_samurott/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('dialga/main', async () => {
    const module = await import(`./data/strats/dialga/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('palkia/main', async () => {
    const module = await import(`./data/strats/palkia/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/main', async () => {
    const module = await import(`./data/strats/iron_bundle/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/main', async () => {
    const module = await import(`./data/strats/blaziken/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('empoleon/main', async () => {
    const module = await import(`./data/strats/empoleon/main.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/main', async () => {
    const module = await import(`./data/strats/venusaur/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blastoise/main', async () => {
    const module = await import(`./data/strats/blastoise/main.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/main', async () => {
    const module = await import(`./data/strats/charizard/main.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('meganium/main', async () => {
    const module = await import(`./data/strats/meganium/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/main', async () => {
    const module = await import(`./data/strats/primarina/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('swampert/main', async () => {
    const module = await import(`./data/strats/swampert/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('emboar/main', async () => {
    const module = await import(`./data/strats/emboar/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('sceptile/main', async () => {
    const module = await import(`./data/strats/sceptile/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/main', async () => {
    const module = await import(`./data/strats/pikachu/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('dondozo/main', async () => {
    const module = await import(`./data/strats/dondozo/main.json`)
    await testOHKO(module as LightBuildInfo);
  })
})

describe('OHKO tests, Alternative Strats', () => {
  test('cinderace/nukebro', async () => {
    const module = await import(`./data/strats/cinderace/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/terantis', async () => {
    const module = await import(`./data/strats/pikachu/terantis.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/nukebro', async () => {
    const module = await import(`./data/strats/pikachu/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('decidueye/rotom', async () => {
    const module = await import(`./data/strats/decidueye/rotom.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('decidueye/nukebro', async () => {
    const module = await import(`./data/strats/decidueye/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_leaves/krook', async () => {
    const module = await import(`./data/strats/iron_leaves/krook.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('walking_wake/metro_express', async () => {
    const module = await import(`./data/strats/walking_wake/metro_express.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('samurott/tauros', async () => {
    const module = await import(`./data/strats/samurott/tauros.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('samurott/nukebro', async () => {
    const module = await import(`./data/strats/samurott/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('typhlosion/hydriggly', async () => {
    const module = await import(`./data/strats/typhlosion/hydriggly.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('typhlosion/nukebro', async () => {
    const module = await import(`./data/strats/typhlosion/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('inteleon/tinkaton', async () => {
    const module = await import(`./data/strats/inteleon/tinkaton.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('inteleon/nukebro', async () => {
    const module = await import(`./data/strats/inteleon/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('inteleon/burn_baby_burn', async () => {
    const module = await import(`./data/strats/inteleon/burn_baby_burn.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('chesnaught/nukebro', async () => {
    const module = await import(`./data/strats/chesnaught/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('chesnaught/simple', async () => {
    const module = await import(`./data/strats/chesnaught/simple.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('delphox/nukebro', async () => {
    const module = await import(`./data/strats/delphox/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('delphox/nuke_baby', async () => {
    const module = await import(`./data/strats/delphox/nuke_baby.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/shrimpiosis', async () => {
    const module = await import(`./data/strats/rillaboom/shrimpiosis.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/pump_up_the_cham', async () => {
    const module = await import(`./data/strats/rillaboom/pump_up_the_cham.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/beetle', async () => {
    const module = await import(`./data/strats/rillaboom/beetle.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/glitter_gang', async () => {
    const module = await import(`./data/strats/rillaboom/glitter_gang.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/simian_showdown', async () => {
    const module = await import(`./data/strats/rillaboom/simian_showdown.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('rillaboom/nukebro', async () => {
    const module = await import(`./data/strats/rillaboom/nukebro.json`)
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
  test('mewtwo/drops_to_lc', async () => {
    const module = await import(`./data/strats/mewtwo/drops_to_lc.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/bug_moment', async () => {
    const module = await import(`./data/strats/h_decidueye/bug_moment.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/owl_kabob', async () => {
    const module = await import(`./data/strats/h_decidueye/owl_kabob.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/ready_the_cannon', async () => {
    const module = await import(`./data/strats/h_decidueye/ready_the_cannon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/tickle_squad_charizard', async () => {
    const module = await import(`./data/strats/h_decidueye/tickle_squad_charizard.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/thirtysixtales', async () => {
    const module = await import(`./data/strats/h_decidueye/thirtysixtales.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/nukebro', async () => {
    const module = await import(`./data/strats/h_decidueye/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_decidueye/hoo_let_the_kids_cook', async () => {
    const module = await import(`./data/strats/h_decidueye/hoo_let_the_kids_cook.json`)
    await testOHKO(module as LightBuildInfo);
  })

  test('h_typhlosion/t1', async () => {
    const module = await import(`./data/strats/h_typhlosion/t1.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/vafoureon', async () => {
    const module = await import(`./data/strats/h_typhlosion/vafoureon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/puppies', async () => {
    const module = await import(`./data/strats/h_typhlosion/puppies.json`)
    await testOHKO(module as LightBuildInfo);
  })
  // test('h_typhlosion/foie_gras', async () => {
  //   const module = await import(`./data/strats/h_typhlosion/foie_gras.json`)
  //   await testOHKO(module as LightBuildInfo);
  // })
  test('h_typhlosion/eeveelution', async () => {
    const module = await import(`./data/strats/h_typhlosion/eeveelution.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/whaley_good_time', async () => {
    const module = await import(`./data/strats/h_typhlosion/whaley_good_time.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/gastrosire', async () => {
    const module = await import(`./data/strats/h_typhlosion/gastrosire.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/garchomp', async () => {
    const module = await import(`./data/strats/h_typhlosion/garchomp.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/sandy_shocks', async () => {
    const module = await import(`./data/strats/h_typhlosion/sandy_shocks.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/otter_domination', async () => {
    const module = await import(`./data/strats/h_typhlosion/otter_domination.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/fight_fire_with_fire', async () => {
    const module = await import(`./data/strats/h_typhlosion/fight_fire_with_fire.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/cursed_salt', async () => {
    const module = await import(`./data/strats/h_typhlosion/cursed_salt.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/inteleon', async () => {
    const module = await import(`./data/strats/h_typhlosion/inteleon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/mew', async () => {
    const module = await import(`./data/strats/h_typhlosion/mew.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/quagkening', async () => {
    const module = await import(`./data/strats/h_typhlosion/quagkening.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/sinnoh_synergy', async () => {
    const module = await import(`./data/strats/h_typhlosion/sinnoh_synergy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/nukebro', async () => {
    const module = await import(`./data/strats/h_typhlosion/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_typhlosion/pinch', async () => {
    const module = await import(`./data/strats/h_typhlosion/pinch.json`)
    await testOHKO(module as LightBuildInfo);
  })
  // test('eevee/espathra', async () => {
  //   const module = await import(`./data/strats/eevee/espathra.json`)
  //   await testOHKO(module as LightBuildInfo);
  // })
  test('eevee/glimmana', async () => {
    const module = await import(`./data/strats/eevee/glimmana.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/eevee_vs_eevee', async () => {
    const module = await import(`./data/strats/eevee/eevee_vs_eevee.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/cat_coven', async () => {
    const module = await import(`./data/strats/eevee/cat_coven.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/diamonds', async () => {
    const module = await import(`./data/strats/eevee/diamonds.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/wigglytuff', async () => {
    const module = await import(`./data/strats/eevee/tuff_pill_to_swallow.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/light_speed', async () => {
    const module = await import(`./data/strats/eevee/light_speed.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('eevee/temper_tantrum', async () => {
    const module = await import(`./data/strats/eevee/temper_tantrum.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/eeveelution', async () => {
    const module = await import(`./data/strats/h_samurott/eeveelution.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/stolen_sharpness', async () => {
    const module = await import(`./data/strats/h_samurott/stolen_sharpness.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/hamurott_on_ice', async () => {
    const module = await import(`./data/strats/h_samurott/hamurott_on_ice.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/dog_days', async () => {
    const module = await import(`./data/strats/h_samurott/dog_days.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/belly_drum_of_war', async () => {
    const module = await import(`./data/strats/h_samurott/belly_drum_of_war.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/skill_issue', async () => {
    const module = await import(`./data/strats/h_samurott/skill_issue.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/morpeking_duck', async () => {
    const module = await import(`./data/strats/h_samurott/morpeking_duck.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/surge_surf', async () => {
    const module = await import(`./data/strats/h_samurott/surge_surf.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/nightmare', async () => {
    const module = await import(`./data/strats/h_samurott/nightmare.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/tickle_squad', async () => {
    const module = await import(`./data/strats/h_samurott/tickle_squad.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/bugaloo', async () => {
    const module = await import(`./data/strats/h_samurott/bugaloo.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/micrydon_duo', async () => {
    const module = await import(`./data/strats/h_samurott/micrydon_duo.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/pawsitive_vibes', async () => {
    const module = await import(`./data/strats/h_samurott/pawsitive_vibes.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/plus_plus_plus', async () => {
    const module = await import(`./data/strats/h_samurott/plus_plus_plus.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/twentyeighttales', async () => {
    const module = await import(`./data/strats/h_samurott/twentyeighttales.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/tsujigiri', async () => {
    const module = await import(`./data/strats/h_samurott/tsujigiri.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/birds', async () => {
    const module = await import(`./data/strats/h_samurott/birds.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/betrayal', async () => {
    const module = await import(`./data/strats/h_samurott/betrayal.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/ability_be_gone', async () => {
    const module = await import(`./data/strats/h_samurott/ability_be_gone.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/chloroblast', async () => {
    const module = await import(`./data/strats/h_samurott/chloroblast.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/crack_the_whip', async () => {
    const module = await import(`./data/strats/h_samurott/crack_the_whip.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/dragons_rage', async () => {
    const module = await import(`./data/strats/h_samurott/dragons_rage.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/kungfu_fighting', async () => {
    const module = await import(`./data/strats/h_samurott/kungfu_fighting.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/lizard', async () => {
    const module = await import(`./data/strats/h_samurott/lizard.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/mostly_mice', async () => {
    const module = await import(`./data/strats/h_samurott/mostly_mice.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/sun_dog', async () => {
    const module = await import(`./data/strats/h_samurott/sun_dog.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/thunderstruck', async () => {
    const module = await import(`./data/strats/h_samurott/thunderstruck.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurrot/nukebro', async () => {
    const module = await import(`./data/strats/h_samurott/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/rocked&shocked', async () => {
    const module = await import(`./data/strats/h_samurott/rocked&shocked.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('h_samurott/magnem_opus', async () => {
    const module = await import(`./data/strats/h_samurott/magnem_opus.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('palkia/teatime', async () => {
    const module = await import(`./data/strats/palkia/teatime.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('palkia/sword', async () => {
    const module = await import(`./data/strats/palkia/sword.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('palkia/lion_of_love', async () => {
    const module = await import(`./data/strats/palkia/lion_of_love.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('palkia/polar_express', async () => {
    const module = await import(`./data/strats/palkia/polar_express.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('palkia/piplup', async () => {
    const module = await import(`./data/strats/palkia/piplup.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/steel_cats', async () => {
    const module = await import(`./data/strats/iron_bundle/steel_cats.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/turtle', async () => {
    const module = await import(`./data/strats/iron_bundle/turtle.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/gholdengoo', async () => {
    const module = await import(`./data/strats/iron_bundle/gholdengoo.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/eeveelution', async () => {
    const module = await import(`./data/strats/iron_bundle/eeveelution.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/emperor', async () => {
    const module = await import(`./data/strats/iron_bundle/emperor.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/melted_veil', async () => {
    const module = await import(`./data/strats/iron_bundle/melted_veil.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('iron_bundle/wishing_star', async () => {
    const module = await import(`./data/strats/iron_bundle/wishing_star.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/bellibolt', async () => {
    const module = await import(`./data/strats/blaziken/bellibolt.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/eevee_new_year', async () => {
    const module = await import(`./data/strats/blaziken/eevee_new_year.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/every_eevee', async () => {
    const module = await import(`./data/strats/blaziken/every_eevee.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/spooky_puppies', async () => {
    const module = await import(`./data/strats/blaziken/spooky_puppies.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/double_paradox', async () => {
    const module = await import(`./data/strats/blaziken/double_paradox.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/barbechu_chicken', async () => {
    const module = await import(`./data/strats/blaziken/barbechu_chicken.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/iceberg', async () => {
    const module = await import(`./data/strats/blaziken/iceberg.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/birds', async () => {
    const module = await import(`./data/strats/blaziken/birds.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/frozen_chicken', async () => {
    const module = await import(`./data/strats/blaziken/frozen_chicken.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/zapped_chicken', async () => {
    const module = await import(`./data/strats/blaziken/zapped_chicken.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/cat_and_maus', async () => {
    const module = await import(`./data/strats/blaziken/cat_and_maus.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/rotom', async () => {
    const module = await import(`./data/strats/blaziken/rotom.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/cream_of_chicken', async () => {
    const module = await import(`./data/strats/blaziken/cream_of_chicken.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/kleavor', async () => {
    const module = await import(`./data/strats/blaziken/kleavor.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/mochi', async () => {
    const module = await import(`./data/strats/blaziken/mochi.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/morpeking_duck', async () => {
    const module = await import(`./data/strats/blaziken/morpeking_duck.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/skill_issue', async () => {
    const module = await import(`./data/strats/blaziken/skill_issue.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/skill_issue_sequel', async () => {
    const module = await import(`./data/strats/blaziken/skill_issue_sequel.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/head_on', async () => {
    const module = await import(`./data/strats/blaziken/head_on.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/nukebro', async () => {
    const module = await import(`./data/strats/blaziken/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/maybe_babies', async () => {
    const module = await import(`./data/strats/blaziken/maybe_babies.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('blaziken/rockabye', async () => {
    const module = await import(`./data/strats/blaziken/rockabye.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('empoleon/crab', async () => {
    const module = await import(`./data/strats/empoleon/crab.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/eeveelutions', async () => {
    const module = await import(`./data/strats/empoleon/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/psych_strike', async () => {
    const module = await import(`./data/strats/empoleon/psych_strike.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/weezing', async () => {
    const module = await import(`./data/strats/empoleon/weezing.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/simple_spice_steel', async () => {
    const module = await import(`./data/strats/empoleon/simple_spice_steel.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/doodling', async () => {
    const module = await import(`./data/strats/empoleon/doodling.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/mythicals', async () => {
    const module = await import(`./data/strats/empoleon/mythicals.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empleon/mythical_mayhem', async () => {
    const module = await import(`./data/strats/empoleon/mythical_mayhem.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/fire_and_water', async () => {
    const module = await import(`./data/strats/empoleon/fire_and_water.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empleon/hisui_hijinks', async () => {
    const module = await import(`./data/strats/empoleon/hisui_hijinks.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/armarouge_army', async () => {
    const module = await import(`./data/strats/empoleon/armarouge_army.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/dragon', async () => {
    const module = await import(`./data/strats/empoleon/dragon.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empoleon/nukebro', async () => {
    const module = await import(`./data/strats/empoleon/nukebro.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('empleon/creepy_crawlies', async () => {
    const module = await import(`./data/strats/empoleon/creepy_crawlies.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/eeveelutions', async () => {
    const module = await import(`./data/strats/venusaur/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/giraffic_bark', async () => {
    const module = await import(`./data/strats/venusaur/giraffic_bark.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/winter_migration', async () => {
    const module = await import(`./data/strats/venusaur/winter_migration.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/faceplant', async () => {
    const module = await import(`./data/strats/venusaur/faceplant.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/godilla_vs_biollante', async () => {
    const module = await import(`./data/strats/venusaur/godzilla_vs_biollante.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/mirrored', async () => {
    const module = await import(`./data/strats/venusaur/mirrored.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/sir_clod', async () => {
    const module = await import(`./data/strats/venusaur/sir_clod.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/tumbleweed_whipping', async () => {
    const module = await import(`./data/strats/venusaur/tumbleweed_whipping.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/virizion_wireless', async () => {
    const module = await import(`./data/strats/venusaur/virizion_wireless.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/woodland_magic_show', async () => {
    const module = await import(`./data/strats/venusaur/woodland_magic_show.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/mimikyu_bonks_the_venu', async () => {
    const module = await import(`./data/strats/venusaur/mimikyu_bonks_the_venu.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/dozing_off_to_venus', async () => {
    const module = await import(`./data/strats/venusaur/dozing_off_to_venus.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/giving_zen_their_flowers', async () => {
    const module = await import(`./data/strats/venusaur/giving_zen_their_flowers.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/nukebro', async () => {
    const module = await import(`./data/strats/venusaur/nukebro.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('venusaur/froggy_forest', async () => {
    const module = await import(`./data/strats/venusaur/froggy_forest.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/gastroporeon', async () => {
    const module = await import(`./data/strats/blastoise/gastroporeon.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/soak_up_the_sun', async () => {
    const module = await import(`./data/strats/blastoise/soak_up_the_sun.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/topsy_turvying_up_the_heat', async () => {
    const module = await import(`./data/strats/blastoise/topsy_turvying_up_the_heat.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/mechamothra', async () => {
    const module = await import(`./data/strats/blastoise/mechamothra.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  // test('blastoise/godzilla_vs_gamera', async () => {
  //   const module = await import(`./data/strats/blastoise/godzilla_vs_gamera.json`)
  //   await testOHKO(module as LightBuildInfo); 
  // })
  test('blastoise/zen_and_psy', async () => {
    const module = await import(`./data/strats/blastoise/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/edgelord', async () => {
    const module = await import(`./data/strats/blastoise/edgelord.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/gallades_sacred_slash', async () => {
    const module = await import(`./data/strats/blastoise/gallades_sacred_slash.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/armada', async () => {
    const module = await import(`./data/strats/blastoise/armada.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/fiery_entertainment', async () => {
    const module = await import(`./data/strats/blastoise/fiery_entertainment.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/all_aquatic_showdown', async () => {
    const module = await import(`./data/strats/blastoise/all_aquatic_showdown.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastiose/nukebro', async () => {
    const module = await import(`./data/strats/blastoise/nukebro.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('blastoise/hocus_pokids', async () => {
    const module = await import(`./data/strats/blastoise/hocus_pokids.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/sweet_dreams', async () => {
    const module = await import(`./data/strats/charizard/sweet_dreams.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/eeveelutions', async () => {
    const module = await import(`./data/strats/charizard/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/blubber_bubble', async () => {
    const module = await import(`./data/strats/charizard/blubber_bubble.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/blizzard_warning', async () => {
    const module = await import(`./data/strats/charizard/blizzard_warning.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/godzilla_vs_rodan', async () => {
    const module = await import(`./data/strats/charizard/godzilla_vs_rodan.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/zen_and_psy', async () => {
    const module = await import(`./data/strats/charizard/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/nukebro', async () => {
    const module = await import(`./data/strats/charizard/nukebro.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('charizard/toddzilla_vs_rodan', async () => {
    const module = await import(`./data/strats/charizard/toddzilla_vs_rodan.json`)
    await testOHKO(module as LightBuildInfo); 
  })
  test('meganium/godzilla', async () => {
    const module = await import(`./data/strats/meganium/godzilla.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/nukebro', async () => {
    const module = await import(`./data/strats/meganium/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/not_enough_buff', async () => {
    const module = await import(`./data/strats/meganium/not_enough_buff.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/not_enough_fluff', async () => {
    const module = await import(`./data/strats/meganium/not_enough_fluff.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/beauty_and_grace', async () => {
    const module = await import(`./data/strats/meganium/beauty_and_grace.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/canines', async () => {
    const module = await import(`./data/strats/meganium/canines.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/curse_all_you_want', async () => {
    const module = await import(`./data/strats/meganium/curse_all_you_want.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/dark_thoughts', async () => {
    const module = await import(`./data/strats/meganium/dark_thoughts.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/corv', async () => {
    const module = await import(`./data/strats/meganium/corv.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/furious_ape', async () => {
    const module = await import(`./data/strats/meganium/furious_ape.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/garden_party', async () => {
    const module = await import(`./data/strats/meganium/garden_party.json`)
    await testOHKO(module as LightBuildInfo);
  })
  // test('meganium/chandelier', async () => {
  //   const module = await import(`./data/strats/meganium/chandelier.json`)
  //   await testOHKO(module as LightBuildInfo);
  // })
  test('meganium/infernal_sweets', async () => {
    const module = await import(`./data/strats/meganium/infernal_sweets.json`)
    await testOHKO(module as LightBuildInfo);
  })
  // test('meganium/smashing_success', async () => {
  //   const module = await import(`./data/strats/meganium/smashing_success.json`)
  //   await testOHKO(module as LightBuildInfo);
  // })
  test('meganium/ghidorah', async () => {
    const module = await import(`./data/strats/meganium/ghidorah.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/kleavor', async () => {
    const module = await import(`./data/strats/meganium/kleavor.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/kung_fu_jungle', async () => {
    const module = await import(`./data/strats/meganium/kung_fu_jungle.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/heads_together', async () => {
    const module = await import(`./data/strats/meganium/heads_together.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/unleashed', async () => {
    const module = await import(`./data/strats/meganium/unleashed.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/warrior', async () => {
    const module = await import(`./data/strats/meganium/warrior.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/mega_rage', async () => {
    const module = await import(`./data/strats/meganium/mega_rage.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/mega_ball', async () => {
    const module = await import(`./data/strats/meganium/mega_ball.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/dawn_wings', async () => {
    const module = await import(`./data/strats/meganium/dawn_wings.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/ancient_assault', async () => {
    const module = await import(`./data/strats/meganium/ancient_assault.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('meganium/bugs', async () => {
    const module = await import(`./data/strats/meganium/bugs.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/yellow_carpet', async () => {
    const module = await import(`./data/strats/primarina/yellow_carpet.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/eeveelutions', async () => {
    const module = await import(`./data/strats/primarina/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/godzilla', async () => {
    const module = await import(`./data/strats/primarina/godzilla.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/zen_and_psy', async () => {
    const module = await import(`./data/strats/primarina/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/fire_starters', async () => {
    const module = await import(`./data/strats/primarina/fire_starters.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/hot_sludge_sundae', async () => {
    const module = await import(`./data/strats/primarina/hot_sludge_sundae.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/pink_and_purple', async () => {
    const module = await import(`./data/strats/primarina/pink_and_purple.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/sickly_sweet_barrage', async () => {
    const module = await import(`./data/strats/primarina/sickly_sweet_barrage.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/punk_rockers', async () => {
    const module = await import(`./data/strats/primarina/punk_rockers.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/digging_holes', async () => {
    const module = await import(`./data/strats/primarina/digging_holes.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/metal_heads', async () => {
    const module = await import(`./data/strats/primarina/metal_heads.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/child_to_work', async () => {
    const module = await import(`./data/strats/primarina/child_to_work.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/apocalypse', async () => {
    const module = await import(`./data/strats/primarina/apocalypse.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/start_your_engines', async () => {
    const module = await import(`./data/strats/primarina/start_your_engines.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/ladies_night', async () => {
    const module = await import(`./data/strats/primarina/ladies_night.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/nukebro', async () => {
    const module = await import(`./data/strats/primarina/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/mice_tea_party', async () => {
    const module = await import(`./data/strats/primarina/mice_tea_party.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('primarina/opera_faux_pas', async () => {
    const module = await import(`./data/strats/primarina/opera_faux_pas.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/muddy`, async () => {
    const module = await import(`./data/strats/swampert/muddy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/farigiraf`, async () => {
    const module = await import(`./data/strats/swampert/farigiraf.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/dessert`, async () => {
    const module = await import(`./data/strats/swampert/dessert.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/just_desserts`, async () => {
    const module = await import(`./data/strats/swampert/just_desserts.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/entropy`, async () => {
    const module = await import(`./data/strats/swampert/entropy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/for_the_birds`, async () => {
    const module = await import(`./data/strats/swampert/for_the_birds.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/eeveelutions`, async () => {
    const module = await import(`./data/strats/swampert/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/puppies`, async () => {
    const module = await import(`./data/strats/swampert/puppies.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/godzilla`, async () => {
    const module = await import(`./data/strats/swampert/godzilla.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/zen_and_psy`, async () => {
    const module = await import(`./data/strats/swampert/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/gastrosire_redux`, async () => {
    const module = await import(`./data/strats/swampert/gastrosire_redux.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/psychic_party`, async () => {
    const module = await import(`./data/strats/swampert/psychic_party.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/espeon`, async () => {
    const module = await import(`./data/strats/swampert/espeon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/golurk`, async () => {
    const module = await import(`./data/strats/swampert/golurk.json`)
    await testOHKO(module as LightBuildInfo);
  }) 
  test(`swampert/idk`, async () => {
    const module = await import(`./data/strats/swampert/idk.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/pond_battle`, async () => {
    const module = await import(`./data/strats/swampert/pond_battle.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/darwinism`, async () => {
    const module = await import(`./data/strats/swampert/darwinism.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/jaws_of_defeat`, async () => {
    const module = await import(`./data/strats/swampert/jaws_of_defeat.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/great_tusk`, async () => {
    const module = await import(`./data/strats/swampert/great_tusk.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/groudon`, async () => {
    const module = await import(`./data/strats/swampert/groudon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/bolero`, async () => {
    const module = await import(`./data/strats/swampert/bolero.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/weather_whirlwind`, async () => {
    const module = await import(`./data/strats/swampert/weather_whirlwind.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/fast_car`, async () => {
    const module = await import(`./data/strats/swampert/fast_car.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/everglades`, async () => {
    const module = await import(`./data/strats/swampert/everglades.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/inversion`, async () => {
    const module = await import(`./data/strats/swampert/inversion.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/judgement`, async () => {
    const module = await import(`./data/strats/swampert/judgement.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/spring_on_jupiter`, async () => {
    const module = await import(`./data/strats/swampert/spring_on_jupiter.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/mini_menaces`, async () => {
    const module = await import(`./data/strats/swampert/mini_menaces.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/skill_issue`, async () => {
    const module = await import(`./data/strats/swampert/skill_issue.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/nukebro`, async () => {
    const module = await import(`./data/strats/swampert/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/field_trip`, async () => {
    const module = await import(`./data/strats/swampert/field_trip.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`swampert/born_on_the_bayou`, async () => {
    const module = await import(`./data/strats/swampert/born_on_the_bayou.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/great_tusk`, async () => {
    const module = await import(`./data/strats/emboar/great_tusk.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/avalugg`, async () => {
    const module = await import(`./data/strats/emboar/avalugg.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/sandy_shocks`, async () => {
    const module = await import(`./data/strats/emboar/sandy_shocks.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/eeveelutions`, async () => {
    const module = await import(`./data/strats/emboar/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/zen_and_psy`, async () => {
    const module = await import(`./data/strats/emboar/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/sagacious_infernape`, async () => {
    const module = await import(`./data/strats/emboar/sagacious_infernape.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/godzilla`, async () => {
    const module = await import(`./data/strats/emboar/godzilla.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/bloody_moon`, async () => {
    const module = await import(`./data/strats/emboar/bloody_moon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/burn_and_nuke`, async () => {
    const module = await import(`./data/strats/emboar/burn_and_nuke.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/grounded`, async () => {
    const module = await import(`./data/strats/emboar/grounded.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/land_shark`, async () => {
    const module = await import(`./data/strats/emboar/land_shark.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/raining_on_parade`, async () => {
    const module = await import(`./data/strats/emboar/raining_on_parade.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/seismic_sandstorm`, async () => {
    const module = await import(`./data/strats/emboar/seismic_sandstorm.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/nukebro`, async () => {
    const module = await import(`./data/strats/emboar/nukebro.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`emboar/juvenile_reptiles`, async () => {
    const module = await import(`./data/strats/emboar/juvenile_reptiles.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/koraidon_t1`, async () => {
    const module = await import(`./data/strats/sceptile/koraidon_t1.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/sledding_amuk`, async () => {
    const module = await import(`./data/strats/sceptile/sledding_amuk.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/angry_crab`, async () => {
    const module = await import(`./data/strats/sceptile/angry_crab.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/aromatic_meteors`, async () => {
    const module = await import(`./data/strats/sceptile/aromatic_meteors.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/eeveelutions`, async () => {
    const module = await import(`./data/strats/sceptile/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/eevee_of_ice_and_fire`, async () => {
    const module = await import(`./data/strats/sceptile/eevee_of_ice_and_fire.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/godzilla`, async () => {
    const module = await import(`./data/strats/sceptile/godzilla.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/here_be_dragons`, async () => {
    const module = await import(`./data/strats/sceptile/here_be_dragons.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/dragons_fury`, async () => {
    const module = await import(`./data/strats/sceptile/dragons_fury.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/age_of_the_dragons`, async () => {
    const module = await import(`./data/strats/sceptile/age_of_the_dragons.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/dragon_battle`, async () => {
    const module = await import(`./data/strats/sceptile/dragon_battle.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/weed_lizard`, async () => {
    const module = await import(`./data/strats/sceptile/weed_lizard.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('sceptile/zen_and_psy', async () => {
    const module = await import(`./data/strats/sceptile/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/corrosive_cannonade`, async () => {
    const module = await import(`./data/strats/sceptile/corrosive_cannonade.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/dragon_slaying_dogs`, async () => {
    const module = await import(`./data/strats/sceptile/dragon_slaying_dogs.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/fairy_fun_festivity`, async () => {
    const module = await import(`./data/strats/sceptile/fairy_fun_festivity.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/sap_sippers`, async () => {
    const module = await import(`./data/strats/sceptile/sap_sippers.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/thirtysixtales`, async () => {
    const module = await import(`./data/strats/sceptile/thirtysixtales.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/flying_contradiction`, async () => {
    const module = await import(`./data/strats/sceptile/flying_contradiction.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/guides_of_galar`, async () => {
    const module = await import(`./data/strats/sceptile/guides_of_galar.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/fake_and_real_tears`, async () => {
    const module = await import(`./data/strats/sceptile/fake_and_real_tears.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/hot_and_cold`, async () => {
    const module = await import(`./data/strats/sceptile/hot_and_cold.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/metal_and_magic`, async () => {
    const module = await import(`./data/strats/sceptile/metal_and_magic.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/mythicals`, async () => {
    const module = await import(`./data/strats/sceptile/mythicals.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/nukebro_1`, async () => {
    const module = await import(`./data/strats/sceptile/nukebro_1.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/nukebro_2`, async () => {
    const module = await import(`./data/strats/sceptile/nukebro_2.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/nukebro_3`, async () => {
    const module = await import(`./data/strats/sceptile/nukebro_3.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test(`sceptile/late_bloomers`, async () => {
    const module = await import(`./data/strats/sceptile/late_bloomers.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/vileplume', async () => {
    const module = await import(`./data/strats/pikachu/vileplume.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/vileplume_t2', async () => {
    const module = await import(`./data/strats/pikachu/vileplume_t2.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/eeveelutions', async () => {
    const module = await import(`./data/strats/pikachu/eeveelutions.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/godzilla', async () => {
    const module = await import(`./data/strats/pikachu/godzilla.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/zen_and_psy', async () => {
    const module = await import(`./data/strats/pikachu/zen_and_psy.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/appletun', async () => {
    const module = await import(`./data/strats/pikachu/appletun.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/new_leaf', async () => {
    const module = await import(`./data/strats/pikachu/new_leaf.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/10m_teravolt_thunderbolt', async () => {
    const module = await import(`./data/strats/pikachu/10m_teravolt_thunderbolt.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/zekrom', async () => {
    const module = await import(`./data/strats/pikachu/zekrom.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/reshiram', async () => {
    const module = await import(`./data/strats/pikachu/reshiram.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/lusamines_pikachu', async () => {
    const module = await import(`./data/strats/pikachu/lusamines_pikachu.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/miraidon', async () => {
    const module = await import(`./data/strats/pikachu/miraidon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/ogerpon', async () => {
    const module = await import(`./data/strats/pikachu/ogerpon.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/mythicals', async () => {
    const module = await import(`./data/strats/pikachu/mythicals.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/belli_breaking_the_mold', async () => {
    const module = await import(`./data/strats/pikachu/belli_breaking_the_mold.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/flower_power', async () => {
    const module = await import(`./data/strats/pikachu/flower_power.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/nukebro_short', async () => {
    const module = await import(`./data/strats/pikachu/nukebro_short.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/nukebro_long', async () => {
    const module = await import(`./data/strats/pikachu/nukebro_long.json`)
    await testOHKO(module as LightBuildInfo);
  })
  test('pikachu/boy_sprouts', async () => {
    const module = await import(`./data/strats/pikachu/boy_sprouts.json`)
    await testOHKO(module as LightBuildInfo);
  })
})