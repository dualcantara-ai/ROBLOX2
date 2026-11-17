export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Interação' | 'Animação' | 'Mecânica' | 'Criação' | 'IA / NPC';
  code: string;
}

export const RIG_CHASE_ATTACK_TEMPLATE = `-- Script de IA para Rig: Perseguir e Atacar Jogadores
local rig = script.Parent
local humanoid = rig:FindFirstChild("Humanoid")
local root = rig:FindFirstChild("HumanoidRootPart") or rig
local Players = game:GetService("Players")

local velocidade = 12 -- Velocidade de perseguição do Rig
local alcanceDeteccao = 50 -- Distância máxima para detectar jogadores
local distanciaAtaque = 4.2 -- Distância para atacar o jogador
local dano = 12 -- Pouco dano por ataque
local cooldownAtaque = 1.0 -- Tempo (segundos) entre ataques

if humanoid then
    humanoid.WalkSpeed = velocidade
end

local ultimoAtaque = 0
print("⚔️ IA Perseguidor ativada no Rig:", rig.Name)

while true do
    if not humanoid or humanoid.Health <= 0 then break end

    local melhorAlvo = nil
    local menorDist = alcanceDeteccao

    for _, player in pairs(Players:GetPlayers()) do
        local character = player.Character
        if character then
            local targetRoot = character:FindFirstChild("HumanoidRootPart")
            local targetHum = character:FindFirstChild("Humanoid")
            if targetRoot and targetHum and targetHum.Health > 0 then
                local dist = (targetRoot.Position - root.Position).Magnitude
                if dist < menorDist then
                    menorDist = dist
                    melhorAlvo = character
                end
            end
        end
    end

    if melhorAlvo then
        local targetRoot = melhorAlvo:FindFirstChild("HumanoidRootPart")
        local targetHum = melhorAlvo:FindFirstChild("Humanoid")

        if menorDist <= distanciaAtaque then
            -- Para de caminhar ao entrar na distância de ataque
            if humanoid then
                humanoid:MoveTo(root.Position)
            end
            if targetHum then
                local agora = tick()
                if agora - ultimoAtaque >= cooldownAtaque then
                    ultimoAtaque = agora
                    targetHum:TakeDamage(dano)
                    print("💥 " .. rig.Name .. " atacou " .. melhorAlvo.Name .. " (-" .. dano .. " HP)")
                end
            end
        elseif humanoid and targetRoot then
            humanoid:MoveTo(targetRoot.Position)
        end
    elseif humanoid then
        humanoid:MoveTo(root.Position)
    end

    task.wait(0.1)
end
`;

export const RIG_DROP_COIN_ON_DEATH_TEMPLATE = `-- Script de Recompensa ao Morrer: Dropar Moeda onde o inimigo morreu
local rig = script.Parent
local humanoid = rig:FindFirstChild("Humanoid")
local root = rig:FindFirstChild("HumanoidRootPart") or rig

local valorMoeda = 25

if humanoid then
    humanoid.Died:Connect(function()
        local pos = root.Position
        local moeda = Instance.new("Part")
        moeda.Name = "MoedaDropada"
        moeda.Type = "coin"
        moeda.CoinValue = valorMoeda
        moeda.Size = Vector3.new(1.6, 1.6, 0.4)
        moeda.Color = Color3.fromRGB(251, 191, 36)
        moeda.Material = Enum.Material.Neon
        moeda.Anchored = true
        moeda.CanCollide = false
        moeda.Position = Vector3.new(pos.X, math.max(1.2, pos.Y - 1.2), pos.Z)
        moeda.Parent = workspace

        print("🪙 " .. rig.Name .. " morreu e deixou uma moeda de B$ " .. valorMoeda .. "!")
    end)
end
`;

export const RIG_SPAWN_PART_ON_DEATH_TEMPLATE = `-- Script ao Morrer: Criar uma Parte exatamente onde o inimigo morreu
local rig = script.Parent
local humanoid = rig:FindFirstChild("Humanoid")
local root = rig:FindFirstChild("HumanoidRootPart") or rig

if humanoid then
    humanoid.Died:Connect(function()
        local pos = root.Position
        local parte = Instance.new("Part")
        parte.Name = "Espolio_" .. rig.Name
        parte.Size = Vector3.new(4, 1, 4)
        parte.Color = Color3.fromRGB(56, 189, 248)
        parte.Material = Enum.Material.Neon
        parte.Anchored = true
        parte.CanCollide = true
        parte.Position = Vector3.new(pos.X, math.max(0.5, pos.Y - 2.2), pos.Z)
        parte.Parent = workspace

        parte.Touched:Connect(function(hit)
            local hum = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
            if hum then
                hum:AddCoins(15)
                parte:Destroy()
            end
        end)

        print("🧱 " .. rig.Name .. " morreu e criou uma parte no local!")
    end)
end
`;

export const LUAU_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'rig-chase-attack',
    name: 'Rig Perseguidor & Ataque (IA NPC)',
    description: 'Faz o Rig perseguir o jogador mais próximo e atacar dando um pouco de dano',
    category: 'IA / NPC',
    code: RIG_CHASE_ATTACK_TEMPLATE
  },
  {
    id: 'rig-death-drop-coin',
    name: 'Rig: Dropar Moeda ao Morrer',
    description: 'Conecta em humanoid.Died para deixar uma moeda coletável onde o inimigo morreu',
    category: 'IA / NPC',
    code: RIG_DROP_COIN_ON_DEATH_TEMPLATE
  },
  {
    id: 'rig-death-spawn-part',
    name: 'Rig: Criar Parte ao Morrer',
    description: 'Conecta em humanoid.Died para criar uma nova parte na posição onde o inimigo morreu',
    category: 'IA / NPC',
    code: RIG_SPAWN_PART_ON_DEATH_TEMPLATE
  },
  {
    id: 'rig-guard-patrol',
    name: 'Rig Guarda de Área (Patrulha + Ataque)',
    description: 'Protege a posição inicial, persegue invasores próximos e retorna ao posto',
    category: 'IA / NPC',
    code: `-- Script de Guarda de Área para Rig
local rig = script.Parent
local humanoid = rig:FindFirstChild("Humanoid")
local root = rig:FindFirstChild("HumanoidRootPart") or rig
local Players = game:GetService("Players")

local postoInicial = Vector3.new(root.Position.X, root.Position.Y, root.Position.Z)
local alcanceAlerta = 35
local distanciaAtaque = 4.0
local dano = 10
local cooldown = 1.1
local ultimoAtaque = 0

if humanoid then
    humanoid.WalkSpeed = 11
end

while true do
    if not humanoid or humanoid.Health <= 0 then break end

    local alvo = nil
    local menorDist = alcanceAlerta

    for _, player in pairs(Players:GetPlayers()) do
        local char = player.Character
        if char then
            local hrp = char:FindFirstChild("HumanoidRootPart")
            local hum = char:FindFirstChild("Humanoid")
            if hrp and hum and hum.Health > 0 then
                local dist = (hrp.Position - root.Position).Magnitude
                if dist < menorDist then
                    menorDist = dist
                    alvo = char
                end
            end
        end
    end

    if alvo then
        local hrp = alvo:FindFirstChild("HumanoidRootPart")
        local hum = alvo:FindFirstChild("Humanoid")
        if menorDist <= distanciaAtaque then
            -- Para de caminhar ao entrar na distância para acertar o jogador
            if humanoid then
                humanoid:MoveTo(root.Position)
            end
            if hum and tick() - ultimoAtaque >= cooldown then
                ultimoAtaque = tick()
                hum:TakeDamage(dano)
            end
        elseif humanoid and hrp then
            humanoid:MoveTo(hrp.Position)
        end
    elseif humanoid then
        local distPosto = (postoInicial - root.Position).Magnitude
        if distPosto > 2 then
            humanoid:MoveTo(postoInicial)
        end
    end

    task.wait(0.12)
end
`
  },
  {
    id: 'lava-killbrick',
    name: 'Lava / Dano ao Tocar',
    description: 'Causa dano ou elimina o jogador quando ele pisa na peça',
    category: 'Interação',
    code: `-- Script de Lava / Killbrick (Dano ao tocar)
local part = script.Parent
local damage = 25 -- Altere para 100 para morte instantânea

print("Script de Lava ativado em:", part.Name)

part.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        humanoid:TakeDamage(damage)
        print("💥 Jogador tocou na lava! Dano:", damage)
    end
end)
`
  },
  {
    id: 'spinner-continuous',
    name: 'Giro Contínuo (Spinner)',
    description: 'Faz a peça girar continuamente no eixo Y como um carrossel ou hélice',
    category: 'Animação',
    code: `-- Script de Rotação Contínua (Spinner)
local part = script.Parent
local spinSpeed = 3 -- Graus por frame

print("Iniciando rotação contínua na peça:", part.Name)

while true do
    -- Incrementa rotação Y
    part.Rotation = Vector3.new(part.Rotation.X, part.Rotation.Y + spinSpeed, part.Rotation.Z)
    task.wait(0.04)
end
`
  },
  {
    id: 'rainbow-disco',
    name: 'Piso Disco (Cores RGB)',
    description: 'Alterna as cores da peça aleatoriamente criando efeito de balada neon',
    category: 'Animação',
    code: `-- Piso Neon Disco (Efeito RGB)
local part = script.Parent
part.Material = "neon"

print("Iniciando efeito Disco Neon em:", part.Name)

while true do
    local r = math.random(50, 255)
    local g = math.random(50, 255)
    local b = math.random(50, 255)
    
    part.Color = Color3.fromRGB(r, g, b)
    task.wait(0.25)
end
`
  },
  {
    id: 'trampoline-jump',
    name: 'Super Trampolim (Pulo Alto)',
    description: 'Aumenta temporariamente o pulo do jogador ao tocar no trampolim',
    category: 'Mecânica',
    code: `-- Super Trampolim / Bounce Pad
local pad = script.Parent
local superJumpPower = 65
local normalJumpPower = 32

print("Trampolim pronto:", pad.Name)

pad.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        print("🚀 Super pulo ativado!")
        humanoid.JumpPower = superJumpPower
        task.wait(2.5)
        humanoid.JumpPower = normalJumpPower
    end
end)
`
  },
  {
    id: 'speed-boost',
    name: 'Speed Booster (Aceleração)',
    description: 'Dá velocidade extrema temporária ao passar por cima',
    category: 'Mecânica',
    code: `-- Speed Boost Pad
local pad = script.Parent
local boostSpeed = 40
local normalSpeed = 16

print("Acelerador ativo:", pad.Name)

pad.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        print("⚡ Velocidade turbo concedida!")
        humanoid.WalkSpeed = boostSpeed
        task.wait(3.5)
        humanoid.WalkSpeed = normalSpeed
    end
end)
`
  },
  {
    id: 'secret-door',
    name: 'Porta Secreta Desaparecedora',
    description: 'Fica transparente e sem colisão por 3 segundos ao ser tocada',
    category: 'Interação',
    code: `-- Porta Secreta / Passagem que abre no toque
local door = script.Parent
local isOpened = false

print("Mecanismo de porta iniciado em:", door.Name)

door.Touched:Connect(function(hit)
    if not isOpened then
        isOpened = true
        print("🚪 Abrindo passagem...")
        door.Transparency = 0.85
        door.CanCollide = false
        
        task.wait(3.5)
        
        print("🔒 Fechando passagem...")
        door.Transparency = 0
        door.CanCollide = true
        isOpened = false
    end
end)
`
  },
  {
    id: 'elevator-moving',
    name: 'Elevador / Plataforma Móvel',
    description: 'Move a plataforma para cima e para baixo suavemente em loop',
    category: 'Animação',
    code: `-- Plataforma Móvel (Elevador)
local platform = script.Parent
local startY = platform.Position.Y
local height = 10
local step = 0.2

print("Elevador ativado na posição inicial:", startY)

while true do
    -- Sobe
    for y = 0, height, step do
        platform.Position = Vector3.new(platform.Position.X, startY + y, platform.Position.Z)
        task.wait(0.04)
    end
    task.wait(1)
    
    -- Desce
    for y = height, 0, -step do
        platform.Position = Vector3.new(platform.Position.X, startY + y, platform.Position.Z)
        task.wait(0.04)
    end
    task.wait(1)
end
`
  },
  {
    id: 'coin-giver',
    name: 'Coletor de Moedas (Coin Giver)',
    description: 'Dá moedas virtuais ao jogador e toca som ao coletar',
    category: 'Mecânica',
    code: `-- Coletor de Moedas
local coin = script.Parent
local coinValue = 25
local collected = false

print("Moeda aguardando coleta:", coin.Name)

coin.Touched:Connect(function(hit)
    if not collected then
        local humanoid = hit.Parent:FindFirstChild("Humanoid")
        if humanoid then
            collected = true
            humanoid:AddCoins(coinValue)
            print("🪙 +", coinValue, "Moedas coletadas!")
            coin.Transparency = 1
            coin.CanCollide = false
            
            -- Reaparece após 10 segundos
            task.wait(10)
            coin.Transparency = 0
            coin.CanCollide = true
            collected = false
        end
    end
end)
`
  },
  {
    id: 'part-spawner',
    name: 'Criador de Peças (Instance.new)',
    description: 'Demonstra a criação de uma nova peça dinamicamente via Luau',
    category: 'Criação',
    code: `-- Criador de Peça Dinâmica (Instance.new)
print("Gerando nova peça via Luau...")

local newPart = Instance.new("Part")
newPart.Name = "LaserPlatform"
newPart.Position = Vector3.new(0, 12, 0)
newPart.Size = Vector3.new(6, 1, 6)
newPart.Color = Color3.fromRGB(0, 220, 255)
newPart.Material = "neon"
newPart.Anchored = true
newPart.CanCollide = true

print("✨ Nova peça criada com sucesso:", newPart.Name)
`
  }
];
