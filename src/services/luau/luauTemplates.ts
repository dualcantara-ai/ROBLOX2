export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Interação' | 'Animação' | 'Mecânica' | 'Criação';
  code: string;
}

export const LUAU_TEMPLATES: ScriptTemplate[] = [
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
