import React, { useState, useEffect, useRef } from 'react';
import { templateService } from '../../services/endpoints';

const sysFields = [
    { label: 'Sistema: Data da Emissão', value: 'Sistema.DataEmissao' },
    { label: 'Curso: Nome', value: 'Curso.Nome' },
    { label: 'Curso: Carga Horária', value: 'Curso.CargaHoraria' },
    { label: 'Turma: Nome', value: 'Turma.Nome' },
    { label: 'Turma: Data de Início', value: 'Turma.DataInicio' },
    { label: 'Turma: Data de Fim', value: 'Turma.DataFim' },
    { label: 'Aluno: Nome Completo', value: 'Aluno.NomeCompleto' },
    { label: 'Aluno: Idade', value: 'Aluno.Idade' },
    { label: 'Aluno: Data de Nascimento', value: 'Aluno.DataNascimento' },
    { label: 'Aluno: Naturalidade', value: 'Aluno.Naturalidade' },
    { label: 'Aluno: Nacionalidade', value: 'Aluno.Nacionalidade' },
    { label: 'Aluno: Sexo', value: 'Aluno.Sexo' },
    { label: 'Aluno: Estado Civil', value: 'Aluno.EstadoCivil' },
    { label: 'Aluno: RG', value: 'Aluno.RG' },
    { label: 'Aluno: CPF', value: 'Aluno.CPF' },
    { label: 'Aluno: Logradouro', value: 'Aluno.Logradouro' },
    { label: 'Aluno: Número/Compl', value: 'Aluno.Numero' },
    { label: 'Aluno: Bairro', value: 'Aluno.Bairro' },
    { label: 'Aluno: CEP', value: 'Aluno.CEP' },
    { label: 'Aluno: Cidade', value: 'Aluno.Cidade' },
    { label: 'Aluno: UF', value: 'Aluno.UF' },
    { label: 'Aluno: Telefone/Celular', value: 'Aluno.Telefone' },
    { label: 'Aluno: Email', value: 'Aluno.Email' },
    { label: 'Aluno: Ponto Referência', value: 'Aluno.PontoReferencia' },
    { label: 'Responsável: Nome Completo', value: 'Responsavel.NomeCompleto' },
    { label: 'Responsável: Idade', value: 'Responsavel.Idade' },
    { label: 'Responsável: Data de Nascimento', value: 'Responsavel.DataNascimento' },
    { label: 'Responsável: Naturalidade', value: 'Responsavel.Naturalidade' },
    { label: 'Responsável: Nacionalidade', value: 'Responsavel.Nacionalidade' },
    { label: 'Responsável: Sexo', value: 'Responsavel.Sexo' },
    { label: 'Responsável: Estado Civil', value: 'Responsavel.EstadoCivil' },
    { label: 'Responsável: RG', value: 'Responsavel.RG' },
    { label: 'Responsável: CPF', value: 'Responsavel.CPF' },
    { label: 'Responsável: Logradouro', value: 'Responsavel.Logradouro' },
    { label: 'Responsável: Número/Compl', value: 'Responsavel.Numero' },
    { label: 'Responsável: Bairro', value: 'Responsavel.Bairro' },
    { label: 'Responsável: CEP', value: 'Responsavel.CEP' },
    { label: 'Responsável: Cidade', value: 'Responsavel.Cidade' },
    { label: 'Responsável: UF', value: 'Responsavel.UF' },
    { label: 'Responsável: Telefone/Celular', value: 'Responsavel.Telefone' },
    { label: 'Responsável: Email', value: 'Responsavel.Email' },
    { label: 'Responsável: Ponto Referência', value: 'Responsavel.PontoReferencia' },
];

export default function ConfigurarTemplateModal({ isOpen, onClose, documentType }) {
    const [file, setFile] = useState(null);
    const [templateConfig, setTemplateConfig] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef(null);
    const modalBodyRef = useRef(null);

    useEffect(() => {
        if (isOpen && documentType) {
            setErrorMsg('');
            setSuccessMsg('');
            loadTemplate();
            setFile(null);
        }
    }, [isOpen, documentType]);

    const loadTemplate = async () => {
        setLoading(true);
        try {
            const res = await templateService.get(documentType.id);
            setTemplateConfig(res.data);
            setTags(res.data.tags || []);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setTemplateConfig(null);
                setTags([]);
            } else {
                setErrorMsg('Erro ao carregar configurações do template.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadTemplate = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        if (!file) {
            setErrorMsg('Selecione um arquivo .docx primeiro.');
            return;
        }

        const formData = new FormData();
        formData.append('TipoDocumento', documentType.id);
        formData.append('Arquivo', file);

        setLoading(true);
        try {
            const res = await templateService.upload(formData);
            setSuccessMsg('Template salvo com sucesso!');
            setTemplateConfig(res.data);
            setTags(res.data.tags || []);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Erro ao enviar template');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = () => {
        setTags([...tags, { tagNoDocumento: '', campoSistema: '' }]);
    };

    const handleRemoveTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleTagChange = (index, field, value) => {
        const newTags = [...tags];
        newTags[index][field] = value;
        setTags(newTags);
    };

    const handleSaveTags = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        // Validação básica
        for (let tag of tags) {
            if (!tag.tagNoDocumento || !tag.campoSistema) {
                setErrorMsg('Preencha todos os campos das tags antes de salvar.');
                if (modalBodyRef.current) {
                    modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }
        }

        setLoading(true);
        try {
            await templateService.saveTags({
                tipoDocumento: documentType.id,
                tags: tags.map(t => ({
                    tagNoDocumento: t.tagNoDocumento,
                    campoSistema: t.campoSistema
                }))
            });
            setSuccessMsg('Tags salvas com sucesso!');
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Erro ao salvar tags');
            if (modalBodyRef.current) modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="modal-header">
                    <h2>Configurar Template: {documentType?.label}</h2>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>

                <div className="modal-body" ref={modalBodyRef} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {errorMsg && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
                    {successMsg && <div className="alert-success" style={{ marginBottom: '16px', padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '14px' }}>{successMsg}</div>}

                    {loading && !templateConfig && <p>Carregando...</p>}

                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Arquivo do Template (.docx)</h3>
                        {templateConfig ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontSize: '14px', color: '#059669', fontWeight: 500 }}>
                                    ✓ Template Existente: {templateConfig.nomeArquivo}
                                </span>
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                                Nenhum template configurado para este documento.
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="file"
                                accept=".docx"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                onClick={handleUploadTemplate}
                                className="btn-primary"
                                disabled={!file || loading}
                            >
                                {loading ? 'Enviando...' : 'Fazer Upload'}
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Mapeamento de Tags</h3>
                            <button onClick={handleAddTag} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                + Adicionar Tag
                            </button>
                        </div>

                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                            Defina as tags utilizadas no template para preenchimento dinâmico. Ex: <span style={{ fontFamily: 'monospace' }}>{`{{NOME_ALUNO}}`}</span>
                        </p>

                        {!templateConfig ? (
                            <div className="alert-warning" style={{ fontSize: '13px' }}>Você precisa fazer o upload de um arquivo de template antes de configurar as tags.</div>
                        ) : tags.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>Nenhuma tag configurada.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {tags.map((tag, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input
                                            placeholder="Ex: {{NOME}}"
                                            className="form-input"
                                            value={tag.tagNoDocumento}
                                            onChange={(e) => handleTagChange(i, 'tagNoDocumento', e.target.value)}
                                            style={{ flex: 1, fontFamily: 'monospace' }}
                                        />
                                        <select
                                            className="form-select"
                                            value={tag.campoSistema}
                                            onChange={(e) => handleTagChange(i, 'campoSistema', e.target.value)}
                                            style={{ flex: 2 }}
                                        >
                                            <option value="">-- Selecione o campo --</option>
                                            {sysFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                        </select>
                                        <button
                                            onClick={() => handleRemoveTag(i)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                                            title="Remover"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-cancel">Cancelar</button>
                    <button
                        onClick={handleSaveTags}
                        className="btn-primary"
                        disabled={loading || !templateConfig}
                    >
                        {loading ? 'Salvando...' : 'Salvar Tags'}
                    </button>
                </div>
            </div>
        </div>
    );
}
