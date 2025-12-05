import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from 'axios'
import './App.css'

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const [ mode, setMode ] = useState('review')
  const [ code, setCode ] = useState(` function sum() {
  return 1 + 1
}`)
  const [ base, setBase ] = useState('')
  const [ local, setLocal ] = useState('')
  const [ remote, setRemote ] = useState('')
  const [ result, setResult ] = useState('')
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState('')
  const [ branches, setBranches ] = useState({ local: [], remote: [] })
  const [ baseBranch, setBaseBranch ] = useState('')
  const [ targetBranch, setTargetBranch ] = useState('')
  const [ conflicts, setConflicts ] = useState([])

  useEffect(() => {
    prism.highlightAll()
    if (mode === 'mergebot') {
      axios.get(`${API_URL}/git/branches`).then(r => setBranches(r.data)).catch(e => {
        const message = e?.response?.data?.error || e?.message || 'Request failed'
        setError(message)
      })
    }
  }, [])

  useEffect(() => {
    if (mode === 'mergebot') {
      axios.get(`${API_URL}/git/branches`).then(r => setBranches(r.data)).catch(e => {
        const message = e?.response?.data?.error || e?.message || 'Request failed'
        setError(message)
      })
    }
  }, [mode])

  async function reviewCode() {
    try {
      setLoading(true)
      setError('')
      const response = await axios.post(`${API_URL}/ai/get-review`, { code })
      setResult(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Request failed'
      setError(message)
      setResult(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  async function resolveMerge() {
    try {
      setLoading(true)
      setError('')
      const response = await axios.post(`${API_URL}/ai/resolve-merge`, { base, local, remote })
      setResult(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Request failed'
      setError(message)
      setResult(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  async function previewMergeConflicts() {
    try {
      setLoading(true)
      setError('')
      const response = await axios.post(`${API_URL}/git/preview-merge`, { baseBranch, targetBranch })
      setConflicts(response.data.files || [])
      if ((response.data.files || []).length === 0) setResult('No conflicts')
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Request failed'
      setError(message)
      setResult(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  async function suggestMerge(file) {
    try {
      setLoading(true)
      setError('')
      const response = await axios.post(`${API_URL}/ai/resolve-merge`, { base: file.base, local: file.local, remote: file.remote })
      setResult(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Request failed'
      setError(message)
      setResult(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main>
        <div className="left">
          <div className="mode">
            <button onClick={() => setMode('review')} disabled={loading || mode==='review'}>Code Review</button>
            <button onClick={() => setMode('merge')} disabled={loading || mode==='merge'}>Resolve Merge</button>
            <button onClick={() => setMode('mergebot')} disabled={loading || mode==='mergebot'}>Merge Bot</button>
          </div>
          {mode === 'review' ? (
            <div className="code">
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 16,
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  height: "100%",
                  width: "100%"
                }}
              />
            </div>
          ) : mode === 'merge' ? (
            <div className="merge">
              <div className="code">
                <div>Base</div>
                <Editor
                  value={base}
                  onValueChange={v => setBase(v)}
                  highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    height: "100%",
                    width: "100%"
                  }}
                />
              </div>
              <div className="code">
                <div>Remote</div>
                <Editor
                  value={remote}
                  onValueChange={v => setRemote(v)}
                  highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    height: "100%",
                    width: "100%"
                  }}
                />
              </div>
              <div className="code">
                <div>Local</div>
                <Editor
                  value={local}
                  onValueChange={v => setLocal(v)}
                  highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    height: "100%",
                    width: "100%"
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mergebot">
              <div className="branches">
                <div>
                  <div>Base Branch</div>
                  <select value={baseBranch} onChange={e => setBaseBranch(e.target.value)}>
                    <option value="">Select</option>
                    {branches.local.map(b => (<option key={`l-${b}`} value={b}>{b}</option>))}
                    {branches.remote.map(b => (<option key={`r-${b}`} value={b}>{b}</option>))}
                  </select>
                </div>
                <div>
                  <div>Target Branch</div>
                  <select value={targetBranch} onChange={e => setTargetBranch(e.target.value)}>
                    <option value="">Select</option>
                    {branches.local.map(b => (<option key={`l2-${b}`} value={b}>{b}</option>))}
                    {branches.remote.map(b => (<option key={`r2-${b}`} value={b}>{b}</option>))}
                  </select>
                </div>
                <div className="review" onClick={loading ? undefined : (baseBranch && targetBranch ? previewMergeConflicts : undefined)}>{loading ? 'Processing…' : 'Preview Merge'}</div>
              </div>
              <div className="conflicts">
                {(conflicts || []).map(file => (
                  <div key={file.path} className="conflict-item">
                    <div>{file.path}</div>
                    <div className="code"><div>Base</div><Editor value={file.base || ''} onValueChange={() => {}} highlight={code => prism.highlight(code, prism.languages.javascript, 'javascript')} padding={10} style={{ fontFamily: '"Fira code", "Fira Mono", monospace', fontSize: 16, border: '1px solid #ddd', borderRadius: '5px', height: '100%', width: '100%' }} /></div>
                    <div className="code"><div>Remote</div><Editor value={file.remote || ''} onValueChange={() => {}} highlight={code => prism.highlight(code, prism.languages.javascript, 'javascript')} padding={10} style={{ fontFamily: '"Fira code", "Fira Mono", monospace', fontSize: 16, border: '1px solid #ddd', borderRadius: '5px', height: '100%', width: '100%' }} /></div>
                    <div className="code"><div>Local</div><Editor value={file.local || ''} onValueChange={() => {}} highlight={code => prism.highlight(code, prism.languages.javascript, 'javascript')} padding={10} style={{ fontFamily: '"Fira code", "Fira Mono", monospace', fontSize: 16, border: '1px solid #ddd', borderRadius: '5px', height: '100%', width: '100%' }} /></div>
                    <div className="review" onClick={loading ? undefined : (() => suggestMerge(file))}>{loading ? 'Processing…' : 'Suggest'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            onClick={loading ? undefined : (mode === 'review' ? reviewCode : (base && local && remote ? resolveMerge : undefined))}
            className="review">{loading ? 'Processing…' : (mode === 'review' ? 'Review' : 'Resolve Merge')}</div>
        </div>
        <div className="right">
          {error && <div className="error">{error}</div>}
          <Markdown rehypePlugins={[ rehypeHighlight ]}>{result}</Markdown>
        </div>
      </main>
    </>
  )
}



export default App
