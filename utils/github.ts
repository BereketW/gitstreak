export async function fetchGithubAPI(endpoint: string, token: string, options: RequestInit = {}) {
    const res = await fetch(`https://api.github.com${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub API error: ${res.status}`);
    }
    return res.json();
}

export async function getDefaultBranch(owner: string, repo: string, token: string) {
    const data = await fetchGithubAPI(`/repos/${owner}/${repo}`, token);
    return data.default_branch;
}

export async function fetchRepoTree(owner: string, repo: string, branch: string, token: string) {
    const data = await fetchGithubAPI(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token);
    return data.tree; 
}

export async function fetchFileContent(owner: string, repo: string, path: string, token: string) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3.raw',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch file content');
    const content = await res.text();
    return { content };
}

export async function createStreakPR(owner: string, repo: string, filePath: string, newContent: string, commitMessage: string, prTitle: string, token: string) {
    const defaultBranch = await getDefaultBranch(owner, repo, token);
    
    // 1. Get latest commit SHA of default branch
    const refData = await fetchGithubAPI(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, token);
    const baseCommitSha = refData.object.sha;

    // 2. Create new branch
    const branchName = `streak-assist-${Date.now()}`;
    await fetchGithubAPI(`/repos/${owner}/${repo}/git/refs`, token, {
        method: 'POST',
        body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseCommitSha
        })
    });

    // 3. Create blob for new file content
    const blobData = await fetchGithubAPI(`/repos/${owner}/${repo}/git/blobs`, token, {
        method: 'POST',
        body: JSON.stringify({
            content: newContent,
            encoding: 'utf-8'
        })
    });

    // 4. Get base tree
    const commitData = await fetchGithubAPI(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, token);
    const baseTreeSha = commitData.tree.sha;

    // 5. Create new tree
    const treeData = await fetchGithubAPI(`/repos/${owner}/${repo}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: [{
                path: filePath,
                mode: '100644',
                type: 'blob',
                sha: blobData.sha
            }]
        })
    });

    // 6. Create commit
    const newCommit = await fetchGithubAPI(`/repos/${owner}/${repo}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage,
            tree: treeData.sha,
            parents: [baseCommitSha]
        })
    });

    // 7. Update branch ref
    await fetchGithubAPI(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
            sha: newCommit.sha,
            force: true
        })
    });

    // 8. Create PR
    const prData = await fetchGithubAPI(`/repos/${owner}/${repo}/pulls`, token, {
        method: 'POST',
        body: JSON.stringify({
            title: prTitle,
            head: branchName,
            base: defaultBranch,
            body: 'Automated minor code styling improvements via GitPush Streak Assist. ✨'
        })
    });

    return prData.html_url;
}
