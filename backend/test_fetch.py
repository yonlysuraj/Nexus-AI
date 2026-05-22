import asyncio
from app.services.readme_gen import _fetch_repo_tree, _fetch_all_context_files

async def main():
    items, branch = await _fetch_repo_tree('yonlysuraj', 'Multi-Agent-System')
    print(f'Branch: {branch}')
    files = await _fetch_all_context_files('yonlysuraj', 'Multi-Agent-System', items, branch)
    print(f'Fetched files: {list(files.keys())}')
    for k, v in files.items():
        print(f'{k}: {len(v)} chars')

if __name__ == '__main__':
    asyncio.run(main())
