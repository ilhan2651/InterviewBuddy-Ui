import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ApiKeysModal from '../components/ApiKeysModal';

const ApiKeysPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = location.state?.returnTo || '/dashboard';

    const handleClose = () => {
        navigate(returnTo, { replace: true });
    };

    const handleSuccess = () => {
        navigate(returnTo, { replace: true });
    };

    return (
        <ApiKeysModal
            isOpen={true}
            onClose={handleClose}
            onSuccess={handleSuccess}
        />
    );
};

export default ApiKeysPage;
