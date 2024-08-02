import { Pokemon } from "../calc";
type ConditionalRoll = {
    name: string,
    roll: (d: number, p: Pokemon) => number,
    condition: (newDamage: number, prevDamage: number, p: Pokemon) => boolean,
}

export function getConditionalRoll(name: string | undefined): ConditionalRoll | undefined {
    // TO DO: things that have totally different sets of rolls (i.e. Multiscale, Super-Effective reducing berries)
    // TO DO: things that shouldn't totally go away if there is a chance to dodge (?) (i.e. Ice Face, Disguise)
    if (!name) { return undefined;}
    switch (name) {
        case "Sturdy":
        case "Focus Sash":
            return {
                name: name,
                roll: (d, p) => p.maxHP() - 1,
                condition: (newDamage, prevDamage, p) => (prevDamage === 0 && newDamage >= p.maxHP()),
            }
        case "Endure": 
            return {
                name: name,
                roll:  (d, p) => p.maxHP() - 1,
                condition: (newDamage, prevDamage, p) => (newDamage >= p.maxHP()),
            }
        case "Sitrus Berry":
            return {
                name: name,
                roll: (d, p) => d - Math.floor(p.maxHP() / (p.hasAbility("Ripen") ? 2 : 4)),
                condition: (newDamage, prevDamage, p) => ((newDamage < p.maxHP()) && (newDamage >= p.maxHP() / 2)),
            }
        case "Oran Berry":
            return {
                name: name,
                roll: (d, p) => d - (p.hasAbility("Ripen") ? 20 : 10),
                condition: (newDamage, prevDamage, p) => ((newDamage < p.maxHP()) && (newDamage >= p.maxHP() / 2)),
            }
        case "Aguav Berry":
        case "Figy Berry":
        case "Iapapa Berry":
        case "Mago Berry":
        case "Wiki Berry":
            return {
                name: name,
                roll: (d, p) => d - Math.floor(p.maxHP() * (p.hasAbility("Ripen") ? 2 : 1) / 3),
                condition: (newDamage, prevDamage, p) => ((newDamage < p.maxHP()) && (newDamage >= p.maxHP() / (p.hasAbility("Gluttony") ? 2 : 4))),
            }
        default: return undefined;
    }
}


export function getRollCounts(rolls: number[][], min: number, max: number, chances: number[] | undefined = undefined) {
    const cumRolls = new Map<number, number>();
    for (let i=0; i<rolls.length; i++) {
        addRollsToCounts(cumRolls, rolls[i], min, max, chances ? chances[i] : undefined);
    }
    return cumRolls;
}

export function addRollsToCounts(cumRolls: Map<number, number>, newRolls: number[], min: number, max: number, chance: number | undefined = undefined) {
    const rollChance = (chance || 1) / newRolls.length;
    const prevCumRolls = new Map<number, number>(cumRolls);
    if (prevCumRolls.size === 0) {
        prevCumRolls.set(0, 1);
    }
    const prevRolls = Array.from(prevCumRolls.keys());
    cumRolls.clear();
    for (let i=0; i<newRolls.length; i++) {
        const roll = newRolls[i];
        for (let j=0; j<prevRolls.length; j++) {
            const prevRoll = prevRolls[j];
            const combinedRoll = prevRoll >= max ? max : Math.max(min, Math.min(max, roll + prevRoll)); // disallow healing if already fainted
            const prevChance = prevCumRolls.get(combinedRoll) || 1;
            const newChance = cumRolls.get(combinedRoll) || 0;
            cumRolls.set(combinedRoll, newChance + prevChance * rollChance);
        }
    }
    // mutates the first argument, but we'll also return it
    return cumRolls;
}

export function catRollCounts(a: Map<number, number>, b: Map<number, number>) {
    const c = new Map<number, number>();
    const aRolls = Array.from(a.keys());
    const bRolls = Array.from(b.keys());
    for (let i=0; i<aRolls.length; i++) {
        const aCount = a.get(aRolls[i]) || 0;
        const cCount = c.get(aRolls[i]) || 0;
        c.set(aRolls[i], aCount + cCount);
    }
    for (let i=0; i<bRolls.length; i++) {
        const bCount = b.get(bRolls[i]) || 0;
        const cCount = c.get(bRolls[i]) || 0;
        c.set(bRolls[i], bCount + cCount);
    }
    return c;
}

export function combineRollCounts(a: Map<number, number>, b: Map<number, number>, min: number, max: number, p?: Pokemon, conditions?: ConditionalRoll[], seqCondition?: ConditionalRoll) {
    const c = new Map<number, number>();
    const seqRolls = new Map<number, number>();
    const aRolls = Array.from(a.keys());
    const bRolls = Array.from(b.keys());
    if (aRolls.length === 0) {
        aRolls.push(0);
    }
    if (bRolls.length === 0) {
        bRolls.push(0);
    }
    for (let i=0; i<aRolls.length; i++) {
        for (let j=0; j<bRolls.length; j++) {
            let combinedRoll = aRolls[i] === max ? max : Math.max(min, Math.min(max, aRolls[i] + bRolls[j]));
            const aChance = a.get(aRolls[i]) || 1;
            const bChance = b.get(bRolls[j]) || 1;
            if (p && conditions) {
                for (const cond of conditions) {
                    if (cond.condition(combinedRoll, aRolls[i], p)) {
                        combinedRoll = cond.roll(combinedRoll, p);
                    }
                }
            }
            if (p && seqCondition && seqCondition.condition(combinedRoll, aRolls[i], p)) {
                const seqRoll = Math.max(min, Math.min(seqCondition.roll(combinedRoll, p)));
                const cChance = seqRolls.get(seqRoll) || 0;
                seqRolls.set(seqRoll, aChance * bChance + cChance);
            } else {
                const cChance = c.get(combinedRoll) || 0;
                c.set(combinedRoll, aChance * bChance + cChance);
            }
        }
    }
    return {c, seqRolls};
}

export function getCumulativeKOChance(rolls: Map<number, number>, hp: number) {
    const numRolls = Array.from(rolls.values()).reduce((a, b) => a + b, 0);
    const koRolls = rolls.get(hp) || 0;
    return parseFloat((koRolls / numRolls * 100).toPrecision(3));
}

export class CumulativeRolls {
    rolls: Map<number, number>[];
    persistentConditions: ConditionalRoll[];
    sequentialConditions: ConditionalRoll[];

    constructor(rolls?: Map<number, number>[], persistentConditions?: ConditionalRoll[], sequentialConditions?: ConditionalRoll[]) {
        this.rolls = rolls || [new Map<number, number>()];
        this.persistentConditions = persistentConditions || [];
        this.sequentialConditions = sequentialConditions || [];
    }

    clone() {
        return new CumulativeRolls(
            this.rolls.map(r => new Map(r)),
            [...this.persistentConditions],
            [...this.sequentialConditions]
        );
    }

    public addPersistentCondition(name: string | undefined) {
        const cond = getConditionalRoll(name);
        if (cond) {
            this.persistentConditions.push(cond);
        }
    }

    public addSequentialCondition(name: string | undefined) {
        const cond = getConditionalRoll(name);
        if (cond) {
            this.sequentialConditions.push(cond);
            this.rolls.push(new Map<number, number>());
        }
    }

    public removePersistentCondition(name: string | undefined) {
        this.persistentConditions = this.persistentConditions.filter(cond => cond.name !== name);
    }

    public removeSequentialCondition(name: string | undefined) {
        const condIdx = this.sequentialConditions.findIndex(cond => cond.name === name);
        if (condIdx >= 0) {
            this.sequentialConditions.splice(condIdx, 1);
            const condRolls = this.rolls.splice(condIdx+1, 1)[0];
            this.rolls[condIdx] = catRollCounts(this.rolls[condIdx], condRolls);
        }
    }

    public addRolls(rolls: Map<number, number>, p: Pokemon) {
        const newRolls:Map<number, number>[] = [];
        const seqConditionalRolls: Map<number, number>[] = [];
        for (let i=0; i<this.rolls.length; i++) {
            if (i === 0 || this.rolls[i].size > 0) {
                const {c, seqRolls} = combineRollCounts(this.rolls[i], rolls, 0, p.maxHP(), p, this.persistentConditions, this.sequentialConditions[i]);
                newRolls.push(c);
                if (i < this.rolls.length) {
                    seqConditionalRolls.push(seqRolls);
                }
            } else {
                newRolls.push(new Map<number, number>());
                if (i < this.rolls.length) {
                    seqConditionalRolls.push(new Map<number, number>());
                }
            }

        }
        let testCounter = 0;
        while (!seqConditionalRolls.every(seqRolls => seqRolls.size === 0)) {
            for (let i=1; i<newRolls.length; i++) {
                const {c, seqRolls} = combineRollCounts(catRollCounts(newRolls[i], seqConditionalRolls[i-1]), new Map<number,number>(), 0, p.maxHP(), p, this.persistentConditions, this.sequentialConditions[i]);
                newRolls[i] = c;
                seqConditionalRolls[i-1] = seqRolls;
            }
            testCounter++;
            if (testCounter > 10) {
                console.log("Infinite loop detected");
                break;
            }
        }
        this.rolls = newRolls;
    }

    public getKOChance(hp: number) {
        let totalRolls = 0;
        let koRolls = 0;
        for (let rolls of this.rolls) {
            totalRolls = totalRolls + Array.from(rolls.values()).reduce((a, b) => a + b, 0);
            koRolls = koRolls + (rolls.get(hp) || 0);
        }
        return parseFloat((koRolls / totalRolls * 100).toPrecision(3));
    }
}