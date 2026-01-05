import BaseModal from '../common/BaseModal'

function ApiModal({ onClose }) {
    return (
        <BaseModal title="API Access" onClose={onClose}>
            <div style={{ padding: '20px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Developer API</h3>
                    <p style={{ marginBottom: '15px' }}>Integrate EthSLT into your own applications.</p>

                    <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <code>Base URL: https://api.ethslt.com/v1</code>
                    </div>
                </div>

                <p style={{ color: 'var(--text-secondary)' }}>
                    Generating API keys is currently disabled for this account type.
                </p>
            </div>
        </BaseModal>
    )
}

export default ApiModal
