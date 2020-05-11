// import react
import React, { Component, useState } from 'react';

// import style file
import './_app.scss';

// import 3rd party libs
import $ from 'jquery';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Button from '@material-ui/core/Button';
import EditRoundedIcon from '@material-ui/icons/EditRounded';
import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';
import HelpTwoToneIcon from '@material-ui/icons/HelpTwoTone';
import BarChartRoundedIcon from '@material-ui/icons/BarChartRounded';
import GamesRoundedIcon from '@material-ui/icons/GamesRounded';
import TripOriginRoundedIcon from '@material-ui/icons/TripOriginRounded';
import ThumbsUpDownRoundedIcon from '@material-ui/icons/ThumbsUpDownRounded';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';
import FiberManualRecordOutlinedIcon from '@material-ui/icons/FiberManualRecordOutlined';
import StarHalfRoundedIcon from '@material-ui/icons/StarHalfRounded';
import ClearRoundedIcon from '@material-ui/icons/ClearRounded';
import ArrowForwardIosRoundedIcon from '@material-ui/icons/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@material-ui/icons/ArrowBackIosRounded';
import CancelIcon from '@material-ui/icons/Cancel';
import FilterHdrIcon from '@material-ui/icons/FilterHdr';
import RateReviewIcon from '@material-ui/icons/RateReview';
import FlagRoundedIcon from '@material-ui/icons/FlagRounded';

import {postForData} from '../utils';

const Levels = ['Master2','Master1','Licence3','Licence2','Licence1','Bac','Premiere']
const Keywords = ['javascript', 'js', 'html', 'css', 'php'];
const Topics = ['html', 'css', 'javascript', 'php'];

const _3WAAns = (props) => {
    const [ans, setAns] = useState('');
    const [editMode, setEditMode] = useState(false);
    
    const handleChange = (e) => setAns(e.target.value);

    const submit = async () => {
        let data = await postForData('/submit-new-answer', {
            questionid: props.questionid,
            answer: ans
        })
        console.log(data);
    }

    return <div className='3wa-answer'>
        <TextareaAutosize 
            onChange={handleChange}
        />
        <Button onClick={submit}>Submit</Button>
    </div>
}

const Answer = (props) => {
    const [editAns, setEditAns] = useState(false);
    const [editLv, setEditLv] = useState(false);
    
    const toggleEditLv = () => setEditLv(!editLv);
    const toggleEditAns = () => setEditAns(!editAns);

    const [editSrc, setEditSrc] = useState(false);
    const [src, setSrc] = useState(props.answer.source)

    const handleChangeAns = (e) => {
        props.save(props.aid, e.target.value);
    }

    const chooseLevel = (s) => {
        props.modifyLv(props.aid, s);
        toggleEditLv();
    }

    const handleChangeSrc = (e) => {
        setSrc(e.target.value);
    }

    const submitSrcChanges = async () => {
        let data = await postForData('/submit-answer-src-changes', {
            answerid: props.answer.id,
            source: src
        })
        setEditSrc(false);
    }

    const enableEditSrc = () => {
        setEditSrc(true);
    }

    return <div className='answer'>
        <div className='supp-container'>
            <div className='Supp Lv'>
                <span className='title'><BarChartRoundedIcon/> <b>Level</b></span>
                <span className='aid'>click to modify</span>
                {editLv?<div className='levels'>
                    {Levels.map((l, id) => <span key={id} className='lv-choice'onClick={_ => chooseLevel(l)}>{l}</span>)}
                    <span onClick={toggleEditLv}><ClearRoundedIcon/></span>
                </div> 
                :<span className='lv' onClick={toggleEditLv}>{props.answer.answer_level}</span>
                }
            </div>
            <div className='Supp Orientation'>
                <span className='title'><GamesRoundedIcon/> <b>Orientation</b></span>
                <span className='lv'>{props.answer.answer_orientation}</span>
            </div>
            <div className='Supp Origin'>
                <span className='title'><TripOriginRoundedIcon/> <b>Sourse</b></span>
                {editSrc? <TextareaAutosize 
                    className='edit-src'
                    defaultValue={src}
                    onChange={handleChangeSrc}
                    onBlur={submitSrcChanges}
                />:
                <span className='src'>
                    <Button onClick={enableEditSrc}><EditRoundedIcon/></Button>
                    <a target='_blank' href={src}>{src}</a>
                </span>}
            </div>
            <div className='Supp Ranking'>
                <span className='title'><FilterHdrIcon/> <b>Ranking</b></span>
                <span className='lv'>{props.answer.answer_rank}</span>
            </div>
            <Button className='Supp Delete' onClick={props.del} startIcon={<HighlightOffRoundedIcon/>}>
                Delete this Answer
            </Button>
        </div>
        
        <div className='Ans'>
            <span className='ttle'>Answer:</span>
            {editAns? <TextareaAutosize
                className='ans'
                onChange={handleChangeAns}
                defaultValue={props.answer.answer_paragraph}
                onBlur={toggleEditAns}
            />: <div onDoubleClick={toggleEditAns}>
                <span className='aid'>double click to modify!</span>
                {props.answer.answer_paragraph}
            </div>}
        </div>
    </div>
}

class Question extends Component {
    state = {
        question: this.props.question.question_text,
        questionid: this.props.question.id,
        nbanswers: -1,
        displayAnswers: false,
        answers: [],
        rating: this.props.question.question_rating,
        deletedAnswers: [],
        reviewed: this.props.question.question_teacher_manual_review,
        answersReviewed: false,
        modifyQuestion: false,
        fuzzy: this.props.question.question_fuzzy
    }

    async componentDidMount() {
        let data = await postForData('/post-nbanswers', {
            questionid: this.state.questionid
        })
        this.setState({nbanswers: data.nbanswers})
    }

    handleQuestionChanges = (e) => {
        this.setState({question: e.target.value});
    }

    editQuestion = () => {
        this.setState({modifyQuestion: true})
    }

    submitQuestionChanges = async () => {
        let data = await postForData('/submit-question-changes', {
            questionid: this.state.questionid,
            question: this.state.question
        })
        console.log(data);
        this.setState({modifyQuestion: false})
    }

    rateThisQuestion = async (score) => {
        let data = await postForData('/submit-question-rating', {
            questionid: this.props.question.id,
            rating: score
        })
        if (data.status = 'ok')
            this.setState({rating: score});
    }

    toggleDisplayAns = async () => {
        if (!this.state.displayAnswers) {
            let data = await postForData('/post-answers', {
                question: this.props.question.question_text,
                id: this.props.question.id
            });
            this.setState({answers: data.answers});
        }
        this.setState({displayAnswers: !this.state.displayAnswers});
    }

    deleteAnswer = (id) => {
        let as = this.state.answers.slice();
        as.splice(id, 1);
        let ds = this.state.deletedAnswers.slice();
        ds.push(this.state.answers[id].answer_temp_id);
        this.setState({answers: as, deletedAnswers: ds, answersReviewed: true});
    }

    saveAnswerModifs = (id, a) => {
        let as = this.state.answers.slice();
        as[id].answer_paragraph = a;
        this.setState({answers: as, answersReviewed: true});
    }

    saveAnswerLv = (id, l) => {
        let as = this.state.answers.slice();
        as[id].answer_level = l;
        this.setState({answers: as, answersReviewed: true});
    }

    saveToDb = async () => {
        if (this.state.answersReviewed) {
            let data = await postForData('/submit-answers', {
                question: this.props.question,
                answers: this.state.answers,
                rating: this.state.rating,
                deletedAnswers: this.state.deletedAnswers
            })
            this.setState({nbanswers: this.state.nbanswers-this.state.deletedAnswers.length, reviewed: true});
        }
    }

    isFuzzyOrNot = async () => {
        let data = await postForData('/fuzzi-question', {
            questionid: this.props.question.id,
            fuzzy: this.state.fuzzy? 0: 1
        })
        console.log(data);
        this.setState({fuzzy: this.state.fuzzy? 0: 1});
    }

    render() {
        /**
         * Rendering function
         */
        let qtext = this.state.question;
        for (const k of Keywords) {
            qtext = qtext.replace(k, `<b>${k}</b>`)
        }
        return <div className={'question' + (this.state.displayAnswers? ' show-answers': '')}>
            <div className='q'>
                <span className='help'>{this.state.questionid}</span>
                <span>
                    {this.state.modifyQuestion?
                        <TextareaAutosize 
                            className='question-editing'
                            onChange={this.handleQuestionChanges}
                            defaultValue={this.state.question}
                            placeholder='retype the question'
                            onBlur={this.submitQuestionChanges}
                        />: 
                        <a className='question-text' dangerouslySetInnerHTML={{__html: qtext}}></a>
                    }
                    {this.state.modifyQuestion? null:
                        <Button className='edit-question-on' onClick={this.editQuestion}><EditRoundedIcon/></Button>
                    }
                    {this.state.nbanswers > -1 ? <i>{'  ' + this.state.nbanswers + (this.state.nbanswers > 1? ' answers': ' answer')}</i>:null}
                </span>
                <Button className='modify-answers' onClick={this.toggleDisplayAns}>
                    {this.state.displayAnswers? 'Hide Answers': 'View Answers'}
                </Button>
            </div>
            <div className={'q-review' + (this.state.displayAnswers? ' show-answers': '')}>
                <div className='rate'>
                    <span className='vote-icon'><StarHalfRoundedIcon/></span>
                    <span>
                    {[1, 2, 3, 4, 5].map(i => {
                        if (i <= this.state.rating) 
                            return <FiberManualRecordRoundedIcon key={i} onClick={_ => this.rateThisQuestion(i)}/>
                        return <FiberManualRecordOutlinedIcon key={i} onClick={_ => this.rateThisQuestion(i)} />
                    })}
                    </span>
                    <span className='vote-urge'>Please vote this question!</span>
                    <span className={'rev' + (this.state.reviewed? ' reviewed': '')}>
                        <RateReviewIcon/> {this.state.reviewed? ' answers reviewed': 'answers not reviewed'}
                    </span>
                    <span className={'clarity' + (this.state.fuzzy? ' fuzzy': '')} 
                        onClick={this.isFuzzyOrNot}>
                        <FlagRoundedIcon/> {this.state.fuzzy? ' question fuzzy/ambigue': ' question clear'}
                    </span>
                </div>
            </div>
            {this.state.displayAnswers & this.state.nbanswers > 0? <div className='as'>
                <_3WAAns questionid={this.state.questionid}/>
                <div className='asc'>
                    {this.state.answers.map((a, id) => <Answer 
                        answer={a} 
                        key={id} 
                        save={this.saveAnswerModifs} 
                        modifyLv={this.saveAnswerLv}
                        aid={id}
                        del={_ => this.deleteAnswer(id)}
                    />)}
                </div>
                <Button className='valid-modifs' onClick={this.saveToDb}>Save changes</Button>
            </div>: null}
        </div>
    }
}

const Tps = (props) => {
    return <div className='topics'>
        {Topics.map((t, ix) => 
        <Button 
            key={ix} 
            className={'topic' + (ix == props.currTopic? ' isCurr': '') } 
            onClick={_ => props.chooseTopic(ix)}
        >
            {t}
        </Button>)}

        <Button 
            className='unset-topic' 
            endIcon={<CancelIcon/>}
            onClick={_ => props.chooseTopic(-1)}
        >
            unset topic
        </Button>
    </div>
}

export default class App extends Component {
    _mounted = false;
    state = {
        nbquestions: 0,
        questions: [],
        // questions range in the db: i = questions fr index 10*i -> 10*(i+1) exclusive
        range: 0,
        topic: -1,
        showOnlyNotReviewed: false
    }

    async componentDidMount() {
        this._mounted = true;
        this.setState({
            questions: (await postForData('/post-questions', {
                range: this.state.range,
                topic: this.state.topic,
                showOnlyNotReviewed: this.state.showOnlyNotReviewed
            })).questions,
            nbquestions: (await postForData('/post-nbquestions', {
                topic: this.state.topic,
                showOnlyNotReviewed: this.state.showOnlyNotReviewed
            })).nbquestions
        });
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    _setState = (dct) => {
        if (this._mounted) this.setState(dct);
    }

    toggleShowNotReviewed = async () => {
        this._setState({
            questions: (await postForData('/post-questions', {
                range: this.state.range,
                topic: this.state.topic,
                showOnlyNotReviewed: !this.state.showOnlyNotReviewed,
                topics: Topics
            })).questions,
            nbquestions: (await postForData('/post-nbquestions', {
                topic: this.state.topic,
                showOnlyNotReviewed: !this.state.showOnlyNotReviewed,
                topics: Topics
            })).nbquestions,
            showOnlyNotReviewed: !this.state.showOnlyNotReviewed
        });
    }

    selectTopic = async (i) => {
        this._setState({
            topic: i,
            questions: (await postForData('/post-questions', {
                range: this.state.range,
                topic: i,
                showOnlyNotReviewed: this.state.showOnlyNotReviewed,
                topics: Topics
            })).questions,
            nbquestions: (await postForData('/post-nbquestions', {
                topic: i,
                showOnlyNotReviewed: this.state.showOnlyNotReviewed,
                topics: Topics
            })).nbquestions,
        })
    }

    nextQuestions = async () => {
        if (this.state.range < this.state.nbquestions-1) {
            let data = await postForData('/post-questions', {
                range: this.state.range + 1,
                topic: this.state.topic,
                showOnlyNotReviewed: this.state.showOnlyNotReviewed,
                topics: Topics
            })
            this._setState({
                range: this.state.range + 1,
                questions: data.questions
            });
        }
    }

    previousQuestions = async () => {
        console.log(this.state.range);
        if (this.state.range > 0) {
            let data = await postForData('/post-questions', {
                range: this.state.range - 1,
                topic: this.state.topic,
                showOnlyNotReviewed: this.state.showOnlyNotReviewed,
                topics: Topics
            });
            this._setState({
                range: this.state.range - 1,
                questions: data.questions
            });
        }
    }

    render() {
        /**
         * Rendering function
         */
        return <div className='qa-select'>
            <div className='reviewed-or-not'>
                <Button 
                    className={this.state.showOnlyNotReviewed? 'not-reviewed': 'all'}
                    onClick={this.toggleShowNotReviewed}
                >
                    {this.state.showOnlyNotReviewed? 'Show All': 'Show Not Reviewed Questions'}
                </Button>
            </div>
            <Tps chooseTopic={this.selectTopic} currTopic={this.state.topic}/>
            <div className='qas'>
                {this.state.questions.map((q, _) => <Question 
                    key={q.id} 
                    question={q} 
                    rateQuestion={this.rateQuestion}
                />)}
            </div>
            <div className='controller'>
                <Button onClick={this.previousQuestions}><ArrowBackIosRoundedIcon/></Button>
                <span>{this.state.range+1}/{Math.ceil(this.state.nbquestions / 20)}</span>
                <Button onClick={this.nextQuestions}><ArrowForwardIosRoundedIcon/></Button>
            </div>
        </div>
    }
}