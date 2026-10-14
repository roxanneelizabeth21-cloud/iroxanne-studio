import { Navigate, useParams } from 'react-router-dom';
export default function LegacyIdeaRedirect(){const {slug}=useParams();return <Navigate replace to={'/ideas?seed='+encodeURIComponent(slug)+'#possibilities'}/>;}
