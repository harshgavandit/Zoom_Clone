import { Navigate } from 'react-router-dom';
export default function withAuth(Component) {
  return function Authenticated(props) {
    return localStorage.getItem('token') ? <Component {...props} /> : <Navigate to="/auth" replace />;
  };
}
