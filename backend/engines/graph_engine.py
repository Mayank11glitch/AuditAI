from typing import Any

def build(transactions: list[Any], rules: list[Any], violations: list[Any]) -> dict[str, Any]:
    """
    Builds the nodes and edges for React Flow Knowledge Graph.

    Re-engineered to leverage the frontend's custom 'rule' and 'transaction' Component Nodes instead of generic defaults.
    """
    nodes: list[Any] = []
    edges: list[Any] = []
    seen_txn = set()
    entity_id_map: dict[str, str] = {}
    entity_idx: int = 1

    # Normalise foreign keys to strings to prevent int/str misses
    violated_rule_ids = {str(v.get("rule_id")) for v in violations if isinstance(v, dict) and v.get("rule_id")}
    violation_map = {str(v.get("rule_id")): v for v in violations if isinstance(v, dict) and v.get("rule_id")}
    known_rules = {str(r.get("id")): r for r in rules if isinstance(r, dict) and r.get("id")}

    # ── Rule nodes (right column) ─────────────────────────────
    rule_y: int = 60
    for rule_id in violated_rule_ids:
        rule = known_rules.get(rule_id, {})
        v_info = violation_map.get(rule_id, {})
        
        desc = rule.get("description") or v_info.get("reason") or f"Compliance Rule {rule_id}"
        sev = rule.get("severity") or v_info.get("severity") or "HIGH"
        rec = v_info.get("recommendation") or rule.get("recommendation") or "Review standard operating procedures for this compliance requirement."

        nodes.append({
            "id":       f"rule_{rule_id}",
            "type":     "rule",
            "position": {"x": 750, "y": rule_y},
            "data":     {
                "label": _truncate(desc, 80),
                "severity": sev,
                "recommendation": rec
            }
        })
        rule_y += 150

    # ── Entity and Transaction nodes ────────────────────────────
    entity_y: int = 60
    txn_y: int = 60
    
    for i, v in enumerate(violations):  # Process all violations for the graph
        tid = str(v.get("transaction_id") or "")
        rid = str(v.get("rule_id") or "")

        if tid and tid not in seen_txn:
            seen_txn.add(tid)
            txn: Any = next((t for t in transactions if isinstance(t, dict) and str(t.get("id")) == tid), {})
            
            amount  = txn.get("amount") or v.get("estimated_penalty") or "0"
            date    = txn.get("date") or v.get("date") or "Unknown Date"
            desc    = _truncate(txn.get("description") or v.get("reason") or "Transaction Record", 40)
            party   = str(txn.get("party") or v.get("party") or "Unknown Entity").strip() or "Unknown Entity"

            # ── Create Entity node ─────────────────────────────────
            if party not in entity_id_map:
                e_id = f"entity_{entity_idx}"
                entity_id_map[party] = e_id
                
                nodes.append({
                    "id":       e_id,
                    "type":     "entity",
                    "position": {"x": 50, "y": entity_y},
                    "data":     {
                        "label": _truncate(party, 30),
                        "type":  "vendor"
                    }
                })
                entity_y += 150  # pyre-ignore[58]
                entity_idx += 1  # pyre-ignore[58]
            else:
                e_id = entity_id_map[party]

            # ── Create Transaction node ────────────────────────────
            nodes.append({
                "id":       f"txn_{tid}",
                "type":     "transaction",
                "position": {"x": 400, "y": txn_y},
                "data":     {
                    "label": f"{date} | {desc}",
                    "amount": f"₹{int(amount):,}" if str(amount).isdigit() or isinstance(amount, (int, float)) else str(amount)
                }
            })
            txn_y += 120

            # ── Edge: Entity → Transaction ─────────────────────────
            edges.append({
                "id":         f"e_{e_id}_txn_{tid}",
                "source":     e_id,
                "target":     f"txn_{tid}",
                "animated":   True,
                "style":      {"stroke": "#60a5fa", "strokeWidth": 2},
            })

        # ── Edge: Transaction → Rule ────────────────────────────
        if tid and rid:
            sev   = v.get("severity", "LOW")
            color = {"HIGH": "#ef4444", "MEDIUM": "#f59e0b", "LOW": "#10b981"}.get(sev, "#8b5cf6")
            edges.append({
                "id":         f"e_{tid}_{rid}_{i}",
                "source":     f"txn_{tid}",
                "target":     f"rule_{rid}",
                "label":      "VIOLATED BY",
                "type":       "smoothstep",
                "animated":   sev == "HIGH",
                "style":      {"stroke": color, "strokeWidth": 2},
                "markerEnd":  {"type": "arrowclosed", "color": color},
                "labelStyle": {"fill": "#ffffff", "fontWeight": "bold", "fontSize": "10px", "letterSpacing": "1px"},
                "labelBgStyle": {"fill": "#1c1917", "fillOpacity": 0.9, "stroke": color, "strokeWidth": 1.5, "rx": 8, "ry": 8},
                "labelBgPadding": [10, 5],
            })

    return {"nodes": nodes, "edges": edges}

def _truncate(text: str, n: int) -> str:
    return text[:n] + "..." if text and len(text) > n else str(text)  # pyre-ignore