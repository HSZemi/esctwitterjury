const analyseData = () => {
    const csvText = document.getElementById('csv-input').value;
    const result = Papa.parse(csvText, {header: true});
    console.log(result);
    const jurors = determineActiveJurors(result);
    console.log(jurors);
    addAverageRanksAndMinMaxStats(result.data, jurors.active);
    result.data.sort((a, b) => b.averageRank - a.averageRank)
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    resultDiv.innerHTML += `<div class="issues">Issues:<br>
${jurors.issues.join('<br>\n')}</div>`;

    resultDiv.innerHTML += `<div class="single-result">Jury members:<br>
${jurors.active.join('<br>\n')}</div>`;

    let i = result.data.length;
    for (let row of result.data) {
        console.log(`${row.Year} ${row.Country} ${row.Artist} ${row.Song} ${row.averageRank} ${row.minValue} ${row.minJurors} ${row.maxValue} ${row.maxJurors}`);
        const tweetText = getTweetText(i, row);
        resultDiv.innerHTML += `<div class="single-result">
<button class="copy-button">copy</button>
<div class="tweet-text">${tweetText.replace(/\n/g, '<br>\n')}</div>
</div>`;
        i--;
    }
    for (let btn of document.getElementsByClassName('copy-button')) {
        btn.onclick = (event) => {
            console.log(event);
            const str = event.target.parentElement.getElementsByClassName('tweet-text')[0].textContent;
            copyToClipboard(str);
            event.target.innerText = 'copied!';
            event.target.classList.add('copied');
            setTimeout(() => {
                event.target.innerText = 'copy';
                event.target.classList.remove('copied')
            }, 2000);
        }
    }
}

const copyToClipboard = (str) => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

const getTweetText = (i, row) => {
    return `${place(i, row.tiebreak)} ${flag(row.Country)} (${row.averageRank.toFixed(2)})
${row.Artist} – ${row.Song} (${row.Year})

Highest rank: ${rank(row.minValue)} (${jurorz(row.minJurors)})
Lowest rank: ${rank(row.maxValue)} (${(jurorz(row.maxJurors))})`;
}

const place = (number, tiebreak) => {
    let tiebreakIndicator = tiebreak ? '(TB) ' : '';
    if (number === 1) {
        return tiebreakIndicator + '🥇';
    } else if (number === 2) {
        return tiebreakIndicator + '🥈';
    } else if (number === 3) {
        return tiebreakIndicator + '🥉';
    }
    return `${tiebreakIndicator}${number}.`;
}

const rank = (number) => {
    if (number % 10 === 1 && !(number % 100 === 11)) {
        return `${number}st`;
    } else if (number % 10 === 2 && !(number % 100 === 12)) {
        return `${number}nd`;
    } else if (number % 10 === 3 && !(number % 100 === 13)) {
        return `${number}rd`;
    } else {
        return `${number}th`;
    }
}

const flag = (country) => {
    switch (country) {
        case 'Austria':
            return '🇦🇹';
        case 'Azerbaijan':
            return '🇦🇿';
        case 'Belgium':
            return '🇧🇪';
        case 'Denmark':
            return '🇩🇰';
        case 'Estonia':
            return '🇪🇪';
        case 'Finland':
            return '🇫🇮';
        case 'France':
            return '🇫🇷';
        case 'Germany':
            return '🇩🇪';
        case 'Greece':
            return '🇬🇷';
        case 'Ireland':
            return '🇮🇪';
        case 'Israel':
            return '🇮🇱';
        case 'Italy':
            return '🇮🇹';
        case 'Latvia':
            return '🇱🇻';
        case 'Luxembourg':
            return '🇱🇺';
        case 'Monaco':
            return '🇲🇨';
        case 'Netherlands':
            return '🇳🇱';
        case 'Norway':
            return '🇳🇴';
        case 'Portugal':
            return '🇵🇹';
        case 'Russia':
            return '🇷🇺';
        case 'Serbia (& Montenegro)':
        case 'Yugoslavia':
            return '🇷🇸🇲🇪';
        case 'Spain':
            return '🇪🇸';
        case 'Sweden':
            return '🇸🇪';
        case 'Switzerland':
            return '🇨🇭';
        case 'Turkey':
            return '🇹🇷';
        case 'Ukraine':
            return '🇺🇦';
        case 'United Kingdom':
            return '🇬🇧';
        default:
            return '🏳️‍🌈';
    }
}


const jurorz = (jurors) => {
    return jurors.map((j) => j.split(' (', 1)[0]).join(', ');
}

const determineActiveJurors = (result) => {
    const jurors = {active: [], issues: []};
    for (let jurorCandidate of result.meta.fields.slice(4)) {
        const entriesForJurorCandidate = [];
        for (let row of result.data) {
            entriesForJurorCandidate.push(row[jurorCandidate]);
        }
        try {
            validateEntriesForJuror(jurorCandidate, entriesForJurorCandidate, result.data.length);
            jurors.active.push(jurorCandidate);
        } catch (e) {
            console.error(e.message);
            jurors.issues.push(e.message);
        }
    }
    return jurors;
}

const validateEntriesForJuror = (juror, entries, count) => {
    if (entries.length !== count) {
        throw new Error(`Juror ${juror} has ${entries.length} entries instead of ${count}, their entries will be disregarded`);
    }
    for (let i = 1; i <= count; i++) {
        if (!entries.includes(i.toString())) {
            throw new Error(`Juror ${juror} does not have rank ${i}, their entries will be disregarded`);
        }
    }
}

const addAverageRanksAndMinMaxStats = (data, jurors) => {
    const firstJuror = jurors[0];
    let previousRow;
    for (let row of data) {
        let sum = 0;
        let minValue = parseInt(row[firstJuror]);
        let maxValue = minValue;
        for (let juror of jurors) {
            let value = parseInt(row[juror]);
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
            sum += value;
        }
        row.averageRank = (sum / jurors.length);
        row.minValue = minValue;
        row.maxValue = maxValue;
        row.minJurors = [];
        row.maxJurors = [];
        for (let juror of jurors) {
            let value = parseInt(row[juror]);
            if (value === minValue) {
                row.minJurors.push(juror);
            }
            if (value === maxValue) {
                row.maxJurors.push(juror);
            }
        }
        row.tiebreak = false;
        if(previousRow){
            if(Math.abs(previousRow.averageRank - row.averageRank) < 0.001){
                previousRow.tiebreak = true
                row.tiebreak = true
            }
        }
        previousRow = row;
    }
}

document.getElementById('analyse-button').onclick = analyseData;