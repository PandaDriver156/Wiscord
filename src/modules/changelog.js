const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

const repoUrl = 'https://github.com/PandaDriver156/Wiscord'; // Repository URL, used for displaying commit links
const outputFile = './CHANGELOG.md'; // Output file where the generated changelog should be written to

const repoTags = getTags();
let providedTag;
switch (process.argv[2]) {
    case 'latest':
        providedTag = repoTags[repoTags.length - 1];
        break;
    case 'unreleased':
        providedTag = 'HEAD';
        break;
    default:
        providedTag = process.argv[2];
        break;
}

const typeNames = [
    'features',
    'bug fixes',
    'documentation',
    'chores',
    'refactors',
    'code styling',
    'other'
];
const typeReferences = {
    feat: 'features',
    feature: 'features',
    fix: 'bug fixes',
    docs: 'documentation',
    chore: 'chores',
    refactor: 'refactors',
    style: 'code styling'
};

const lines = [];
if (providedTag) {
    let commitsArray = [];
    if (providedTag === 'HEAD') {
        commitsArray = getCommitsInTag('HEAD', repoTags.pop());
    } else {
        const providedTagIndex = repoTags.indexOf(providedTag);
        const previousTag = repoTags[providedTagIndex - 1];
        commitsArray = getCommitsInTag(providedTag, previousTag);
    }
    lines.push(commitsArray.join('\n'));
} else {
    const tags = ['HEAD', ...repoTags.reverse()];
    for (let i = 0; i < tags.length; i++) {
        lines.push(getCommitsInTag(tags[i], tags[i + 1]).join('\n'));
    }
}

updateChangelogFile(lines.join('\n'));

function getTags() {
    const output = execSync('git tag -l').toString();
    const tagsArray = output.split('\n').filter(tag => tag); // This filtering ensures that the returned line is not empty
    return tagsArray;
}

function findFirstCommit() {
    return execSync('git log --reverse --format=%H')
        .toString()
        .split('\n')
        .shift();
}

function getCommitsInTag(tag = 'HEAD', previousTag = findFirstCommit()) {
    const changelogLines = [];
    const rawDatas = execSync(`git log ${previousTag}..${tag} --format="%H %s"`)
        .toString()
        .split('\n')
        .filter(rawData => !!rawData);

    if (tag === 'HEAD')
        tag = '*Unreleased*';

    const types = {};

    typeNames.forEach(typeName => {
        types[typeName] = [];
    });

    if (rawDatas.length && !providedTag)
        changelogLines.push(`# ${tag}`);

    rawDatas.map(rawData => {
        const args = rawData.trim().split(/ +/g);
        const hash = args.shift();

        const message = args.join(' ');
        const commit = {
            hash, message
        };

        const typeMatch = commit.message.match(`^(${Object.keys(typeReferences).join('|')})\\(?.*\\)?:`);
        const isTypeSyntaxed = !!typeMatch;
        if (isTypeSyntaxed) {
            const matched = typeMatch[0];
            const type = typeMatch[1];
            const group = matched.slice(type.length + 1, matched.indexOf(')'));

            if (group === 'Release') return;

            commit.group = group;
            commit.message = args.slice(1).join(' ');

            if (typeReferences[type])
                types[typeReferences[type]].push(commit);
        } else {
            types.other.push(commit);
        }
    });

    Object.keys(types).forEach(commitType => {
        if (types[commitType].length) {
            changelogLines.push(`## ${capitalize(commitType)}`);
            types[commitType].forEach(commit => {
                const shorthash = shortHash(commit.hash);
                const commitUrl = `${repoUrl}/commit/${commit.hash}`;
                const group = commit.group;
                changelogLines.push(`- ${group ? `**${group}**: ` : ''}${capitalize(commit.message)} ([\`${shorthash}\`](${commitUrl}))`);
            });
        }
    });

    return changelogLines;
}

function updateChangelogFile(changelog) {
    writeFileSync(outputFile, changelog);
}

function shortHash(hash) {
    const hashArray = hash.split('');
    hashArray.length = 6;
    hash = hashArray.join('');
    return hash;
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
