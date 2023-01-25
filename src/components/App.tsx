import { useGitRepo } from '../hooks/useGitRepo';
import './App.css';

function useActiveRepo() {
  const url = new URL(location.href);
  const [user, repoName, ...params] = url.pathname.split('/').filter(Boolean);
  const repo = useGitRepo(user, repoName);

  console.log({ user, repoName, params, repo });
  return repo;
}

function App() {
  const repo = useActiveRepo();

  return <>Pensieve</>;
}

export default App;
