import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import { HStack } from '@renderer/components/Layout'
import SelectModelPopup from '@renderer/components/Popups/SelectModelPopup'
import { DEFAULT_CONTEXTCOUNT, DEFAULT_TEMPERATURE } from '@renderer/config/constant'
import { findTokenLimit, isGeminiReasoningModel } from '@renderer/config/models'
import { SettingRow } from '@renderer/pages/settings'
import { Assistant, AssistantSettingCustomParameters, AssistantSettings } from '@renderer/types'
import { modalConfirm } from '@renderer/utils'
import { Button, Col, Divider, Input, InputNumber, Row, Select, Slider, Switch, Tooltip } from 'antd'
import { isNull } from 'lodash'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  assistant: Assistant
  updateAssistant: (assistant: Assistant) => void
  updateAssistantSettings: (settings: Partial<AssistantSettings>) => void
}

const AssistantModelSettings: FC<Props> = ({ assistant, updateAssistant, updateAssistantSettings }) => {
  const [temperature, setTemperature] = useState(assistant?.settings?.temperature ?? DEFAULT_TEMPERATURE)
  const [contextCount, setContextCount] = useState(assistant?.settings?.contextCount ?? DEFAULT_CONTEXTCOUNT)
  const [enableMaxTokens, setEnableMaxTokens] = useState(assistant?.settings?.enableMaxTokens ?? false)
  const [maxTokens, setMaxTokens] = useState(assistant?.settings?.maxTokens ?? 0)
  const [streamOutput, setStreamOutput] = useState(assistant?.settings?.streamOutput ?? true)
  const [toolUseMode, setToolUseMode] = useState(assistant?.settings?.toolUseMode ?? 'prompt')
  const [defaultModel, setDefaultModel] = useState(assistant?.defaultModel)
  const [topP, setTopP] = useState(assistant?.settings?.topP ?? 1)
  const [customParameters, setCustomParameters] = useState<AssistantSettingCustomParameters[]>(
    assistant?.settings?.customParameters ?? []
  )
  const [includeThoughts, setIncludeThoughts] = useState(assistant?.settings?.includeThoughts ?? false)
  const [thinkingBudget, setThinkingBudget] = useState(assistant?.settings?.thinkingBudget ?? 0)
  const [autoThinkingBudget, setAutoThinkingBudget] = useState(assistant?.settings?.autoThinkingBudget ?? true)

  const isGeminiModel = assistant.model ? isGeminiReasoningModel(assistant.model) : false
  const tokenLimit = assistant.model ? findTokenLimit(assistant.model.id) : { min: 0, max: 32768 }

  const customParametersRef = useRef(customParameters)

  customParametersRef.current = customParameters

  const { t } = useTranslation()

  const onTemperatureChange = (value) => {
    if (!isNaN(value as number)) {
      updateAssistantSettings({ temperature: value })
    }
  }

  const onContextCountChange = (value) => {
    if (!isNaN(value as number)) {
      updateAssistantSettings({ contextCount: value })
    }
  }

  const onTopPChange = (value) => {
    if (!isNaN(value as number)) {
      updateAssistantSettings({ topP: value })
    }
  }

  const onAddCustomParameter = () => {
    const newParam = { name: '', value: '', type: 'string' as const }
    const newParams = [...customParameters, newParam]
    setCustomParameters(newParams)
    updateAssistantSettings({ customParameters: newParams })
  }

  const onUpdateCustomParameter = (
    index: number,
    field: 'name' | 'value' | 'type',
    value: string | number | boolean | object
  ) => {
    const newParams = [...customParameters]
    if (field === 'type') {
      let defaultValue: any = ''
      switch (value) {
        case 'number':
          defaultValue = 0
          break
        case 'boolean':
          defaultValue = false
          break
        case 'json':
          defaultValue = ''
          break
        default:
          defaultValue = ''
      }
      newParams[index] = {
        ...newParams[index],
        type: value as any,
        value: defaultValue
      }
    } else {
      newParams[index] = { ...newParams[index], [field]: value }
    }
    setCustomParameters(newParams)
  }

  const renderParameterValueInput = (param: (typeof customParameters)[0], index: number) => {
    switch (param.type) {
      case 'number':
        return (
          <InputNumber
            style={{ width: '100%' }}
            value={param.value as number}
            onChange={(value) => onUpdateCustomParameter(index, 'value', value || 0)}
            step={0.01}
          />
        )
      case 'boolean':
        return (
          <Switch
            checked={param.value as boolean}
            onChange={(checked) => onUpdateCustomParameter(index, 'value', checked)}
          />
        )
      case 'json':
        return (
          <Input
            value={typeof param.value === 'string' ? param.value : JSON.stringify(param.value, null, 2)}
            onChange={(e) => {
              try {
                const jsonValue = JSON.parse(e.target.value)
                onUpdateCustomParameter(index, 'value', jsonValue)
              } catch {
                onUpdateCustomParameter(index, 'value', e.target.value)
              }
            }}
          />
        )
      default:
        return (
          <Input
            value={param.value as string}
            onChange={(e) => onUpdateCustomParameter(index, 'value', e.target.value)}
          />
        )
    }
  }

  const onDeleteCustomParameter = (index: number) => {
    const newParams = customParameters.filter((_, i) => i !== index)
    setCustomParameters(newParams)
    updateAssistantSettings({ customParameters: newParams })
  }

  const onReset = () => {
    setTemperature(DEFAULT_TEMPERATURE)
    setContextCount(DEFAULT_CONTEXTCOUNT)
    setEnableMaxTokens(false)
    setMaxTokens(0)
    setStreamOutput(true)
    setTopP(1)
    setCustomParameters([])
    setToolUseMode('prompt')
    updateAssistantSettings({
      temperature: DEFAULT_TEMPERATURE,
      contextCount: DEFAULT_CONTEXTCOUNT,
      enableMaxTokens: false,
      maxTokens: 0,
      streamOutput: true,
      topP: 1,
      customParameters: [],
      toolUseMode: 'prompt'
    })
  }

  const onSelectModel = useCallback(async () => {
    const currentModel = defaultModel ? assistant?.model : undefined
    const selectedModel = await SelectModelPopup.show({ model: currentModel })
    if (selectedModel) {
      setDefaultModel(selectedModel)
      updateAssistant({
        ...assistant,
        model: selectedModel,
        defaultModel: selectedModel
      })
    }
  }, [assistant, defaultModel, updateAssistant])

  useEffect(() => {
    return () => updateAssistantSettings({ customParameters: customParametersRef.current })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatSliderTooltip = (value?: number) => {
    if (value === undefined) return ''
    return value.toString()
  }

  return (
    <Container>
      <Row align="middle" style={{ marginBottom: 10 }}>
        <Label style={{ marginBottom: 10 }}>{t('assistants.settings.default_model')}</Label>
        <Col span={24}>
          <HStack alignItems="center" gap={5}>
            <Button
              icon={defaultModel ? <ModelAvatar model={defaultModel} size={20} /> : <PlusOutlined />}
              onClick={onSelectModel}>
              {defaultModel ? defaultModel.name : t('agents.edit.model.select.title')}
            </Button>
            {defaultModel && (
              <Button
                icon={<DeleteOutlined />}
                type="text"
                onClick={() => {
                  setDefaultModel(undefined)
                  updateAssistant({ ...assistant, defaultModel: undefined })
                }}
                danger
              />
            )}
          </HStack>
        </Col>
      </Row>
      <Divider style={{ margin: '10px 0' }} />
      <Row align="middle">
        <Label>{t('chat.settings.temperature')}</Label>
        <Tooltip title={t('chat.settings.temperature.tip')}>
          <QuestionIcon />
        </Tooltip>
      </Row>
      <Row align="middle" gutter={20}>
        <Col span={20}>
          <Slider
            min={0}
            max={2}
            onChange={setTemperature}
            onChangeComplete={onTemperatureChange}
            value={typeof temperature === 'number' ? temperature : 0}
            marks={{ 0: '0', 0.7: '0.7', 2: '2' }}
            step={0.01}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={0}
            max={2}
            step={0.01}
            value={temperature}
            changeOnBlur
            onChange={(value) => {
              if (!isNull(value)) {
                setTemperature(value)
                setTimeout(() => updateAssistantSettings({ temperature: value }), 500)
              }
            }}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Label>{t('chat.settings.top_p')}</Label>
        <Tooltip title={t('chat.settings.top_p.tip')}>
          <QuestionIcon />
        </Tooltip>
      </Row>
      <Row align="middle" gutter={20}>
        <Col span={20}>
          <Slider
            min={0}
            max={1}
            onChange={setTopP}
            onChangeComplete={onTopPChange}
            value={typeof topP === 'number' ? topP : 1}
            marks={{ 0: '0', 1: '1' }}
            step={0.01}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            value={topP}
            changeOnBlur
            onChange={(value) => {
              if (!isNull(value)) {
                setTopP(value)
                setTimeout(() => updateAssistantSettings({ topP: value }), 500)
              }
            }}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Label>
          {t('chat.settings.context_count')}{' '}
          <Tooltip title={t('chat.settings.context_count.tip')}>
            <QuestionIcon />
          </Tooltip>
        </Label>
      </Row>
      <Row align="middle" gutter={20}>
        <Col span={20}>
          <Slider
            min={0}
            max={100}
            onChange={setContextCount}
            onChangeComplete={onContextCountChange}
            value={typeof contextCount === 'number' ? contextCount : 0}
            marks={{ 0: '0', 25: '25', 50: '50', 75: '75', 100: t('chat.settings.max') }}
            step={1}
            tooltip={{ formatter: formatSliderTooltip }}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={0}
            max={20}
            step={1}
            value={contextCount}
            changeOnBlur
            onChange={(value) => {
              if (!isNull(value)) {
                setContextCount(value)
                setTimeout(() => updateAssistantSettings({ contextCount: value }), 500)
              }
            }}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      <Divider style={{ margin: '10px 0' }} />
      <SettingRow style={{ minHeight: 30 }}>
        <HStack alignItems="center">
          <Label>{t('chat.settings.max_tokens')}</Label>
          <Tooltip title={t('chat.settings.max_tokens.tip')}>
            <QuestionIcon />
          </Tooltip>
        </HStack>
        <Switch
          checked={enableMaxTokens}
          onChange={async (enabled) => {
            if (enabled) {
              const confirmed = await modalConfirm({
                title: t('chat.settings.max_tokens.confirm'),
                content: t('chat.settings.max_tokens.confirm_content'),
                okButtonProps: {
                  danger: true
                }
              })
              if (!confirmed) return
            }

            setEnableMaxTokens(enabled)
            updateAssistantSettings({ enableMaxTokens: enabled })
          }}
        />
      </SettingRow>
      {enableMaxTokens && (
        <Row align="middle" style={{ marginTop: 5, marginBottom: 5 }}>
          <Col span={24}>
            <InputNumber
              disabled={!enableMaxTokens}
              min={0}
              max={10000000}
              step={100}
              value={maxTokens}
              changeOnBlur
              onChange={(value) => {
                if (!isNull(value)) {
                  setMaxTokens(value)
                  setTimeout(() => updateAssistantSettings({ maxTokens: value }), 1000)
                }
              }}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      )}
      <Divider style={{ margin: '10px 0' }} />
      <SettingRow style={{ minHeight: 30 }}>
        <Label>{t('models.stream_output')}</Label>
        <Switch
          checked={streamOutput}
          onChange={(checked) => {
            setStreamOutput(checked)
            updateAssistantSettings({ streamOutput: checked })
          }}
        />
      </SettingRow>
      <Divider style={{ margin: '10px 0' }} />
      <SettingRow style={{ minHeight: 30 }}>
        <Label>{t('assistants.settings.tool_use_mode')}</Label>
        <Select
          value={toolUseMode}
          style={{ width: 110 }}
          onChange={(value) => {
            setToolUseMode(value)
            updateAssistantSettings({ toolUseMode: value })
          }}>
          <Select.Option value="prompt">{t('assistants.settings.tool_use_mode.prompt')}</Select.Option>
          <Select.Option value="function">{t('assistants.settings.tool_use_mode.function')}</Select.Option>
        </Select>
      </SettingRow>
      {isGeminiModel && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <SettingRow style={{ minHeight: 30 }}>
            <Label>
              {t('assistants.settings.include_thoughts')}{' '}
              <Tooltip title={t('assistants.settings.include_thoughts.tip')}>
                <QuestionIcon />
              </Tooltip>
            </Label>
            <Switch
              checked={includeThoughts}
              onChange={(checked) => {
                setIncludeThoughts(checked)
                updateAssistantSettings({ includeThoughts: checked })
              }}
            />
          </SettingRow>
          {includeThoughts && (
            <>
              <Row align="middle" justify="space-between">
                <HStack>
                  <Label>
                    {t('assistants.settings.thinking_budget')}{' '}
                    <Tooltip title={t('assistants.settings.thinking_budget.tip')}>
                      <QuestionIcon />
                    </Tooltip>
                  </Label>
                </HStack>
                <HStack>
                  <Label>{t('assistants.settings.thinking_budget.auto')}</Label>
                  <Switch
                    checked={autoThinkingBudget}
                    onChange={(checked) => {
                      setAutoThinkingBudget(checked)
                      updateAssistantSettings({ autoThinkingBudget: checked })
                    }}
                  />
                </HStack>
              </Row>
              <Row align="middle" gutter={20}>
                <Col span={20}>
                  <Slider
                    min={tokenLimit?.min || 0}
                    max={tokenLimit?.max || 32768}
                    onChange={setThinkingBudget}
                    onChangeComplete={(value) => updateAssistantSettings({ thinkingBudget: value })}
                    value={thinkingBudget}
                    step={128}
                    disabled={autoThinkingBudget}
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    min={tokenLimit?.min || 0}
                    max={tokenLimit?.max || 32768}
                    step={128}
                    value={thinkingBudget}
                    changeOnBlur
                    onChange={(value) => {
                      if (!isNull(value)) {
                        setThinkingBudget(value)
                        setTimeout(() => updateAssistantSettings({ thinkingBudget: value }), 500)
                      }
                    }}
                    style={{ width: '100%' }}
                    disabled={autoThinkingBudget}
                  />
                </Col>
              </Row>
            </>
          )}
        </>
      )}
      <Divider style={{ margin: '10px 0' }} />
      <SettingRow style={{ minHeight: 30 }}>
        <Label>{t('models.custom_parameters')}</Label>
        <Button icon={<PlusOutlined />} onClick={onAddCustomParameter}>
          {t('models.add_parameter')}
        </Button>
      </SettingRow>
      {customParameters.map((param, index) => (
        <Row key={index} align="stretch" gutter={10} style={{ marginTop: 10 }}>
          <Col span={6}>
            <Input
              placeholder={t('models.parameter_name')}
              value={param.name}
              onChange={(e) => onUpdateCustomParameter(index, 'name', e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              value={param.type}
              onChange={(value) => onUpdateCustomParameter(index, 'type', value)}
              style={{ width: '100%' }}>
              <Select.Option value="string">{t('models.parameter_type.string')}</Select.Option>
              <Select.Option value="number">{t('models.parameter_type.number')}</Select.Option>
              <Select.Option value="boolean">{t('models.parameter_type.boolean')}</Select.Option>
              <Select.Option value="json">{t('models.parameter_type.json')}</Select.Option>
            </Select>
          </Col>
          <Col span={12}>{renderParameterValueInput(param, index)}</Col>
          <Col span={2} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<DeleteOutlined />} onClick={() => onDeleteCustomParameter(index)} danger />
          </Col>
        </Row>
      ))}
      <Divider style={{ margin: '15px 0' }} />
      <HStack justifyContent="flex-end">
        <Button onClick={onReset} style={{ width: 80 }} danger type="primary">
          {t('chat.settings.reset')}
        </Button>
      </HStack>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 5px;
`

const Label = styled.p`
  margin-right: 5px;
  font-weight: 500;
`

const QuestionIcon = styled(QuestionCircleOutlined)`
  font-size: 12px;
  cursor: pointer;
  color: var(--color-text-3);
`

export default AssistantModelSettings
