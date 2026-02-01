
export class DiceSoNice {

    static addColorSets(dice3d) {
        dice3d.addColorset({
            name: 'holy',
            description: 'Holy',
            category: 'DICESONICE.DamageTypes',
            foreground: '#F9B333',
            background: '#FFFFFF',
            outline: 'black',
            texture: 'paper'
        });
        dice3d.addColorset({
            name: 'death',
            description: "Death",
            category: 'DICESONICE.DamageTypes',
            foreground: '#ffffff',
            background: "#6F0000",
            outline: 'black',
            texture: 'skulls',
        });
        dice3d.addColorset({
            name: 'poison',
            description: 'DICESONICE.ColorPoison',
            category: 'DICESONICE.DamageTypes',
            foreground: '#009500',
            background: '#30113c',
            outline: 'white',
            texture: 'cloudy_2',
            material: 'iridescent'
        });
        dice3d.addColorset({
            name: 'earth',
            description: 'DICESONICE.ColorEarth',
            category: 'DICESONICE.DamageTypes',
            foreground: '#6C9943',
            background: '#56341a',
            outline: 'black',
            texture: 'speckles'
        });
        dice3d.addColorset({
            name: 'fire',
            description: 'DICESONICE.ColorFire',
            category: 'DICESONICE.DamageTypes',
            foreground: '#f8d84f',
            background: '#f43c04',
            outline: 'black',
            texture: 'fire'
        });
        dice3d.addColorset({
            name: 'electricity',
            description: 'Electricity',
            category: 'DICESONICE.DamageTypes',
            foreground: '#ffffae',
            background: '#f3ca40',
            outline: 'black',
            texture: 'ice_2'
        });
        dice3d.addColorset({
            name: 'sonic',
            description: 'Sonic',
            category: 'DICESONICE.DamageTypes',
            foreground: '#FFC500',
            background: '#7D7D7D',
            outline: 'black',
            texture: 'marble'
        });
        dice3d.addColorset({
            name: 'mental',
            description: 'Mental',
            category: 'DICESONICE.DamageTypes',
            foreground: '#D6A8FF',
            background: ['#934FC3','#C949FC'],
            outline: 'black',
            texture: 'astral',
            material: 'iridescent'
        });
    }
}